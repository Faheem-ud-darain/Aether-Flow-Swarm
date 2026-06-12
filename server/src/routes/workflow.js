import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { runScopingAgent, runRiskAgent, runLedgerAgent } from '../utils/swarmOrchestrator.js';
import { sanitizeTextInput } from '../utils/security.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 0. File Ingestion & Parsing Endpoint (PDF, DOCX, TXT)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    let extractedText = '';

    if (originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (originalname.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (originalname.endsWith('.txt') || originalname.endsWith('.md') || originalname.endsWith('.json') || originalname.endsWith('.csv')) {
      extractedText = buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Only PDF, DOCX, and text files are supported.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'The uploaded file contains no readable text.' });
    }

    // Apply security filter to parsed file text
    const securityCheck = sanitizeTextInput(extractedText);
    if (!securityCheck.isValid) {
      return res.status(400).json({ error: `Security Scan Blocked: ${securityCheck.reason}` });
    }

    return res.json({ text: extractedText.trim() });
  } catch (error) {
    console.error('[File Ingestion Error]', error);
    return res.status(500).json({ error: 'Failed to parse the uploaded document', details: error.message });
  }
});

// 0. Get all workflow sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.workflowSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: { orderBy: { createdAt: 'asc' } },
        checkpoints: { orderBy: { createdAt: 'desc' } }
      }
    });
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve sessions list', details: error.message });
  }
});

// 1. Get detailed session status and logs (for frontend polling)
router.get('/session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.workflowSession.findUnique({
      where: { id },
      include: {
        logs: { orderBy: { createdAt: 'asc' } },
        checkpoints: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve session metrics', details: error.message });
  }
});

// 2. Initialize a new top-level agent operation session and trigger pipeline execution
router.post('/session/start', async (req, res) => {
  try {
    const { title, rawInput, provider, model, sandboxMode } = req.body;
    
    // Check security injection/overflow vulnerabilities
    const securityCheck = sanitizeTextInput(rawInput || '');
    if (!securityCheck.isValid) {
      return res.status(400).json({ error: `Security Scan Blocked: ${securityCheck.reason}` });
    }

    // Create new session
    const session = await prisma.workflowSession.create({
      data: {
        title: title || 'Enterprise Allocation Assessment',
        status: 'PROCESSING'
      }
    });

    // Run the pipeline asynchronously in background to avoid blocking response
    (async () => {
      try {
        const scopingData = await runScopingAgent(session.id, rawInput || '', provider, model, sandboxMode);
        const { isHitlTriggered } = await runRiskAgent(session.id, scopingData, rawInput || '', provider, model, sandboxMode);
        
        if (!isHitlTriggered) {
          // If no human gate triggered, immediately finish with Ledger Agent
          await runLedgerAgent(session.id, scopingData, null, provider, model, sandboxMode);
        }
      } catch (err) {
        console.error(`[Background Pipeline Failure] Session ${session.id}:`, err);
        await prisma.agentLog.create({
          data: {
            sessionId: session.id,
            agentName: 'System Router',
            status: 'ERROR',
            payload: '{}',
            message: `Pipeline encountered runtime error: ${err.message}`
          }
        });
        await prisma.workflowSession.update({
          where: { id: session.id },
          data: { status: 'TERMINATED' }
        });
      }
    })();

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Database capture failure', details: error.message });
  }
});

// 3. Append a downstream execution log from an active agent
router.post('/session/:id/log', async (req, res) => {
  try {
    const { id } = req.params;
    const { agentName, status, payload, message } = req.body;

    const logEntry = await prisma.agentLog.create({
      data: {
        sessionId: id,
        agentName,
        status,
        payload: typeof payload === 'object' ? JSON.stringify(payload) : payload,
        message
      }
    });

    if (status === 'AWAITING_HUMAN') {
      await prisma.workflowSession.update({
        where: { id },
        data: { status: 'AWAITING_HUMAN' }
      });
    }

    return res.status(201).json(logEntry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to write agent log telemetry', details: error.message });
  }
});

// 4. Handle incoming Human-in-the-Loop overrides from the Next.js frontend dashboard
router.post('/session/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { conflictType, decision, modifications, feedback, provider, model, sandboxMode } = req.body;

    // Write audit trail record
    const checkpoint = await prisma.humanCheckpoint.create({
      data: {
        sessionId: id,
        conflictType,
        decision,
        modifications: modifications ? JSON.stringify(modifications) : null,
        feedback
      }
    });

    // Update overall status
    await prisma.workflowSession.update({
      where: { id },
      data: { status: decision === 'APPROVED' ? 'PROCESSING' : 'TERMINATED' }
    });

    if (decision === 'APPROVED') {
      // Retrieve scoping payload to run Ledger Agent
      const scopingLog = await prisma.agentLog.findFirst({
        where: {
          sessionId: id,
          agentName: 'Scoping Agent',
          status: 'SUCCESS'
        }
      });

      const scopingData = scopingLog ? JSON.parse(scopingLog.payload) : {};
      
      // Resume pipeline asynchronously
      (async () => {
        try {
          await runLedgerAgent(id, scopingData, modifications, provider, model, sandboxMode);
        } catch (err) {
          console.error(`[Background Resuming Failure] Session ${id}:`, err);
          await prisma.agentLog.create({
            data: {
              sessionId: id,
              agentName: 'System Router',
              status: 'ERROR',
              payload: '{}',
              message: `Pipeline resume failure: ${err.message}`
            }
          });
          await prisma.workflowSession.update({
            where: { id },
            data: { status: 'TERMINATED' }
          });
        }
      })();
    } else {
      // Log termination
      await prisma.agentLog.create({
        data: {
          sessionId: id,
          agentName: 'System Router',
          status: 'ERROR',
          payload: '{}',
          message: `Swarm workflow terminated by human administrator. Reason: ${feedback || 'No feedback provided'}`
        }
      });
    }

    return res.status(200).json({ status: 'Success', checkpoint });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process manual override gateway', details: error.message });
  }
});

// 5. Get system settings (e.g. Budget Safety Limit and Compliance Policy)
router.get('/settings', async (req, res) => {
  try {
    let limitSetting = await prisma.systemSetting.findUnique({
      where: { key: 'BUDGET_LIMIT' }
    });
    if (!limitSetting) {
      limitSetting = await prisma.systemSetting.create({
        data: { key: 'BUDGET_LIMIT', value: '12000' }
      });
    }

    let policySetting = await prisma.systemSetting.findUnique({
      where: { key: 'COMPLIANCE_POLICY' }
    });
    if (!policySetting) {
      policySetting = await prisma.systemSetting.create({
        data: {
          key: 'COMPLIANCE_POLICY',
          value: 'All projects must check GDPR and SOC2 compliance. Heavy usage of external APIs must trigger human warnings.'
        }
      });
    }

    return res.json({ 
      budgetLimit: parseInt(limitSetting.value, 10),
      compliancePolicy: policySetting.value
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

// 6. Update system settings
router.post('/settings', async (req, res) => {
  try {
    const { budgetLimit, compliancePolicy } = req.body;

    const responseData = {};

    if (budgetLimit !== undefined) {
      const limitSetting = await prisma.systemSetting.upsert({
        where: { key: 'BUDGET_LIMIT' },
        update: { value: String(budgetLimit) },
        create: { key: 'BUDGET_LIMIT', value: String(budgetLimit) }
      });
      responseData.budgetLimit = parseInt(limitSetting.value, 10);
    }

    if (compliancePolicy !== undefined) {
      const policySetting = await prisma.systemSetting.upsert({
        where: { key: 'COMPLIANCE_POLICY' },
        update: { value: String(compliancePolicy) },
        create: { key: 'COMPLIANCE_POLICY', value: String(compliancePolicy) }
      });
      responseData.compliancePolicy = policySetting.value;
    }

    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

export default router;
