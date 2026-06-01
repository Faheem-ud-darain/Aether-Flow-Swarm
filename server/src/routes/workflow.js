import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});
const router = Router();

// 1. Initialize a new top-level agent operation session
router.post('/session/start', async (req, res) => {
  try {
    const { title } = req.body;
    const session = await prisma.workflowSession.create({
      data: {
        title: title || 'Enterprise Allocation Assessment',
        status: 'PROCESSING'
      }
    });
    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Database capture failure', details: error.message });
  }
});

// 2. Append a downstream execution log from an active agent
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

    // If an agent triggers an explicit check, shift overall session state
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

// 3. Handle incoming Human-in-the-Loop overrides from the Next.js frontend dashboard
router.post('/session/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { conflictType, decision, modifications, feedback } = req.body;

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

    // Update overall runtime pipeline visibility state
    await prisma.workflowSession.update({
      where: { id },
      data: { status: decision === 'APPROVED' ? 'PROCESSING' : 'TERMINATED' }
    });

    return res.status(200).json({ status: 'Success', checkpoint });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process manual override gateway', details: error.message });
  }
});

export default router;
