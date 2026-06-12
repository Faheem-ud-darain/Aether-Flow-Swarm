import { PrismaClient } from '@prisma/client';
import { featherlessClient, aimlClient } from './aiClient.js';
import { scopingBandClient, riskBandClient, ledgerBandClient } from './bandClient.js';
import { projectScopingSchema, riskAssessmentSchema, financialLedgerSchema } from '../schemas/index.js';
import { detectApplicableFrameworks, evaluateCompliance, buildCompliancePolicyPrompt } from './complianceRules.js';

const prisma = new PrismaClient();

/**
 * Checks if the LLM client is configured with a real key.
 */
function isConfigured(provider) {
  if (provider === 'featherless') {
    return process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_API_KEY !== 'dummy-key-change-me';
  }
  if (provider === 'aiml') {
    return process.env.AIML_API_KEY && process.env.AIML_API_KEY !== 'your_aiml_api_key_here';
  }
  return false;
}

/**
 * Generates an LLM prompt request and parses JSON response.
 */
async function queryLLM(provider, model, prompt, systemPrompt = '') {
  let client = aimlClient;
  let activeModel = model || 'meta-llama/Meta-Llama-3-8B-Instruct';

  if (provider === 'featherless') {
    client = featherlessClient;
    activeModel = model || 'meta-llama/Meta-Llama-3-8B-Instruct';
  }

  const response = await client.chat.completions.create({
    model: activeModel,
    messages: [
      { role: 'system', content: systemPrompt + '\nRespond ONLY with a valid raw JSON object matching the requested schema. Do not output markdown code blocks (e.g. do not wrap in ```json), explanations or text before/after.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1
  });

  const content = response.choices?.[0]?.message?.content?.trim() || '{}';
  try {
    // Strip markdown formatting if the model ignored system instructions
    const cleanJsonStr = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJsonStr);
  } catch (err) {
    console.error('[Orchestrator LLM Parse Failure] Raw output:', content);
    throw new Error(`Failed to parse LLM response as JSON: ${err.message}`);
  }
}

/**
 * Step 1: Scoping Agent
 */
export async function runScopingAgent(sessionId, rawInput, provider = 'featherless', model = '', sandboxMode = false) {
  console.log(`[Scoping Agent] Processing session ${sessionId}...`);

  // Query historical completed sessions for learning
  let historicalContext = '';
  let pastSessionsCount = 0;
  try {
    const pastSessions = await prisma.workflowSession.findMany({
      where: { status: 'COMPLETED' },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          where: {
            agentName: 'Scoping Agent',
            status: 'SUCCESS'
          }
        }
      }
    });

    if (pastSessions.length > 0) {
      const validLogs = pastSessions.map(ps => ps.logs[0]).filter(Boolean);
      pastSessionsCount = validLogs.length;
      if (pastSessionsCount > 0) {
        historicalContext = "\nHere are examples of past completed scoping structures for reference (Historical Database learning):\n" + 
          validLogs.map((log, index) => {
            return `Project #${index + 1} Scope payload: ${log.payload}`;
          }).join('\n---\n');
      }
    }
  } catch (err) {
    console.error('[Historical learning query failed]', err);
  }

  const initMessage = pastSessionsCount > 0 
    ? `Ingesting project instructions. Parsing feature requests. [Historical learning matched ${pastSessionsCount} past project scopes]`
    : `Ingesting project instructions. Parsing feature requests. [No past project scopes found in SQLite history]`;

  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Scoping Agent',
      status: 'INFO',
      payload: '{}',
      message: initMessage
    }
  });

  let scopingData;

  if (sandboxMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    scopingData = generateMockScoping(rawInput);
  } else if (isConfigured(provider)) {
    try {
      const systemPrompt = 'You are the Scoping Agent. Your task is to analyze user raw requirements and generate project scoping values. You MUST return a JSON object containing the parsed/estimated project details. The JSON object MUST strictly conform to this JSON schema: ' + JSON.stringify(projectScopingSchema) + '\n' +
        'CRITICAL: Do NOT output the schema definition itself. You must populate the fields with actual data. If the requirements do not specify a budget, timeline, or features, you MUST estimate/invent reasonable baseline figures (e.g. budget amount: 10000, duration: 6 weeks) and define at least 3 relevant software features based on the project description.' + historicalContext;
      const prompt = `Requirements: ${rawInput}`;
      scopingData = await queryLLM(provider, model, prompt, systemPrompt);
    } catch (err) {
      console.error('[Scoping Agent error]', err);
      if (!sandboxMode) throw err;
      scopingData = generateMockScoping(rawInput);
    }
  } else {
    // Simulate LLM reasoning
    await new Promise(resolve => setTimeout(resolve, 1500));
    scopingData = generateMockScoping(rawInput);
  }

  // Update WorkflowSession title with LLM-analyzed project name
  if (scopingData.project_name) {
    try {
      await prisma.workflowSession.update({
        where: { id: sessionId },
        data: { title: scopingData.project_name }
      });
      console.log(`[Scoping Agent] Updated session title to: "${scopingData.project_name}"`);
    } catch (err) {
      console.error('[Scoping Agent] Failed to update session title:', err);
    }
  }

  // Write log to DB
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Scoping Agent',
      status: 'SUCCESS',
      payload: JSON.stringify(scopingData),
      message: `Scope analysis finalized: ${scopingData.features?.length || 0} features scoped.`
    }
  });

  // Attempt to broadcast to Band.ai
  if (!sandboxMode && process.env.BAND_SCOPING_AGENT_KEY) {
    try {
      // 1. Create chat room dynamically
      const title = `AetherFlow Session: ${sessionId.slice(0, 8)}`;
      const roomRes = await scopingBandClient.createChatRoom(title);
      if (roomRes.success && roomRes.data && roomRes.data.data && roomRes.data.data.id) {
        const chatRoomId = roomRes.data.data.id;
        console.log(`[Band.ai] Created Chat Room ${chatRoomId} for session ${sessionId}`);

        // 2. Save room ID to settings key-value store
        await prisma.systemSetting.upsert({
          where: { key: 'CHAT_ROOM_ID_' + sessionId },
          update: { value: chatRoomId },
          create: { key: 'CHAT_ROOM_ID_' + sessionId, value: chatRoomId }
        });

        // 3. Add Risk Agent and Ledger Agent as participants to the room
        if (process.env.BAND_RISK_AGENT_ID) {
          await scopingBandClient.addParticipant(chatRoomId, process.env.BAND_RISK_AGENT_ID);
        }
        if (process.env.BAND_LEDGER_AGENT_ID) {
          await scopingBandClient.addParticipant(chatRoomId, process.env.BAND_LEDGER_AGENT_ID);
        }

        // 4. Send message to room (mentioning Risk Agent to bypass cannot_mention_self)
        const targetMention = process.env.BAND_RISK_AGENT_ID || '';
        const featuresList = scopingData.features?.map(f => `• **${f.name}**: ${f.description} (Priority: ${f.priority})`).join('\n') || 'None';
        const scopingMsg = `📋 **Project Scope Finalized**\n\n` +
          `💰 **Estimated Budget**: $${scopingData.budget?.amount || 0} ${scopingData.budget?.currency || 'USD'}\n` +
          `⏱️ **Estimated Duration**: ${scopingData.timeline?.estimatedDurationWeeks || 0} weeks\n\n` +
          `🛠️ **Features Scoped**:\n${featuresList}`;
        await scopingBandClient.sendMessage(chatRoomId, scopingMsg, targetMention);
      }
    } catch (err) {
      console.warn('[Band.ai Scoping Broadcast Failed]', err.message);
    }
  }

  return scopingData;
}

/**
 * Step 2: Risk Agent
 */
export async function runRiskAgent(sessionId, scopingData, rawInput = '', provider = 'featherless', model = '', sandboxMode = false) {
  console.log(`[Risk Agent] Running audit for session ${sessionId}...`);
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Risk Agent',
      status: 'INFO',
      payload: '{}',
      message: 'Running compliance security checks on features matrix...'
    }
  });

  // ──── Compliance Rules Engine: Auto-detect applicable frameworks ────
  const applicableFrameworks = detectApplicableFrameworks(rawInput, scopingData);
  console.log(`[Risk Agent] Detected frameworks: ${applicableFrameworks.join(', ')}`);

  // Run rule-by-rule compliance evaluation
  const complianceResult = evaluateCompliance(rawInput, scopingData, applicableFrameworks);
  console.log(`[Risk Agent] Compliance evaluation: ${complianceResult.violationsFound} violations, score ${complianceResult.riskScore}/100`);

  // Log the compliance engine results
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Risk Agent',
      status: 'INFO',
      payload: JSON.stringify({
        engine: 'ComplianceRulesEngine',
        frameworks: complianceResult.applicableFrameworks,
        totalRules: complianceResult.totalRulesEvaluated,
        violations: complianceResult.violationsFound,
        engineScore: complianceResult.riskScore
      }),
      message: `Compliance engine scanned ${complianceResult.totalRulesEvaluated} rules across ${applicableFrameworks.length} frameworks. ${complianceResult.violationsFound} compliance requirements flagged.`
    }
  });

  // Build enriched compliance policy for LLM prompt
  const compliancePolicy = buildCompliancePolicyPrompt(applicableFrameworks);

  let riskData;

  if (sandboxMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    riskData = generateMockRisk(scopingData, complianceResult);
  } else if (isConfigured(provider)) {
    try {
      const systemPrompt = 'You are the Risk Agent. Analyze scoped project details for compliance and risk level. You MUST return a JSON object containing the risk assessment details. The JSON object MUST strictly conform to this JSON schema: ' + JSON.stringify(riskAssessmentSchema) + '\n' +
        'CRITICAL: Do NOT output the schema definition itself. You must evaluate the input and populate the fields with actual risk categories, scores (0-100), and compliance status.\n' +
        'The following compliance rules engine has pre-evaluated the project. Use this as context:\n' + complianceResult.summary + '\n\n' +
        'Full Compliance Policy:\n' + compliancePolicy;
      const prompt = `Features Scoped: ${JSON.stringify(scopingData)}`;
      riskData = await queryLLM(provider, model, prompt, systemPrompt);
    } catch (err) {
      console.error('[Risk Agent error]', err);
      if (!sandboxMode) throw err;
      riskData = generateMockRisk(scopingData, complianceResult);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1500));
    riskData = generateMockRisk(scopingData, complianceResult);
  }

  let budgetLimit = 12000;
  try {
    const limitSetting = await prisma.systemSetting.findUnique({
      where: { key: 'BUDGET_LIMIT' }
    });
    if (limitSetting) {
      budgetLimit = parseInt(limitSetting.value, 10);
    }
  } catch (err) {
    console.error('[Settings BUDGET_LIMIT query failed]', err);
  }
  const budgetAmount = scopingData.budget?.amount || 0;
  
  // Decide if manual HITL trigger is required
  let isHitlTriggered = false;
  let status = 'SUCCESS';
  let message = 'Compliance audit completed. Project parameters within safe guidelines.';

  const isSevereRisk = riskData.flagged_risks?.some(r => r.severity === 'critical' || r.severity === 'high');
  const isBudgetViolation = budgetAmount > budgetLimit;

  if (isBudgetViolation || isSevereRisk || riskData.compliance_status?.status === 'non-compliant') {
    isHitlTriggered = true;
    status = 'AWAITING_HUMAN';
    message = isBudgetViolation 
      ? `CRITICAL BUDGET EXCEEDED: Proposed budget $${budgetAmount} exceeds standard safety limit of $${budgetLimit}.` 
      : 'CRITICAL COMPLIANCE WARNING: Regulatory standards check failed or severe risks flagged.';
  }

  // Update workflow session
  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { status: isHitlTriggered ? 'AWAITING_HUMAN' : 'PROCESSING' }
  });

  // Write log to DB
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Risk Agent',
      status: isHitlTriggered ? 'WARNING' : 'SUCCESS',
      payload: JSON.stringify(riskData),
      message
    }
  });

  if (isHitlTriggered) {
    await prisma.agentLog.create({
      data: {
        sessionId,
        agentName: 'System Router',
        status: 'AWAITING_HUMAN',
        payload: JSON.stringify({
          conflictType: isBudgetViolation ? 'Budget Constraint Violation' : 'Regulatory Check Failure',
          description: isBudgetViolation 
            ? `Proposed project budget ($${budgetAmount}) exceeds the target baseline budget of $${budgetLimit}.`
            : 'compliance checks failed on regulatory standards.',
          proposedBudget: budgetAmount,
          estimatedWeeks: scopingData.timeline?.estimatedDurationWeeks || 6
        }),
        message: 'Triggers Human-In-The-Loop gate. Awaiting architectural override approval...'
      }
    });
  }

  // Attempt to broadcast to Band.ai
  if (!sandboxMode && process.env.BAND_RISK_AGENT_KEY) {
    try {
      const chatRoomSetting = await prisma.systemSetting.findUnique({
        where: { key: 'CHAT_ROOM_ID_' + sessionId }
      });
      if (chatRoomSetting && chatRoomSetting.value) {
        const targetMention = process.env.BAND_LEDGER_AGENT_ID || '';
        const risksList = riskData.flagged_risks?.map(r => `• [${r.severity.toUpperCase()}] **${r.category}**: ${r.description}`).join('\n') || 'None';
        const compliance = riskData.compliance_status?.status?.toUpperCase() || 'UNKNOWN';
        const riskMsg = `🛡️ **Compliance & Risk Audit Completed**\n\n` +
          `🚦 **Status**: ${compliance}\n` +
          `📈 **Risk Score**: ${riskData.risk_score || 0}/100\n\n` +
          `⚠️ **Flagged Risks**:\n${risksList}\n\n` +
          (isHitlTriggered 
            ? `🛑 **Action Required**: Swarm suspended. Budget or compliance limits exceeded. Awaiting administrator override.`
            : `✅ **Action**: Project parameters verified. Moving to financial milestone setup.`);
        await riskBandClient.sendMessage(
          chatRoomSetting.value, 
          riskMsg, 
          targetMention
        );
      }
    } catch (err) {
      console.warn('[Band.ai Risk Broadcast Failed]', err.message);
    }
  }

  return { riskData, isHitlTriggered };
}

/**
 * Step 3: Ledger Agent
 */
export async function runLedgerAgent(sessionId, scopingData, decisionData = null, provider = 'featherless', model = '', sandboxMode = false) {
  console.log(`[Ledger Agent] Processing ledger writes for session ${sessionId}...`);
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Ledger Agent',
      status: 'INFO',
      payload: '{}',
      message: 'Calculating final budget breakdowns & milestone distributions.'
    }
  });

  const finalBudget = decisionData ? decisionData.proposedBudget : (scopingData.budget?.amount || 10000);
  const timelineWeeks = decisionData ? decisionData.estimatedWeeks : (scopingData.timeline?.estimatedDurationWeeks || 6);

  let ledgerData;

  if (sandboxMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    ledgerData = generateMockLedger(finalBudget, timelineWeeks);
  } else if (isConfigured(provider)) {
    try {
      const systemPrompt = 'You are the Ledger Agent. Finalize payment milestones and operating runway. You MUST return a JSON object containing the financial ledger data. The JSON object MUST strictly conform to this JSON schema: ' + JSON.stringify(financialLedgerSchema) + '\n' +
        'CRITICAL: Do NOT output the schema definition itself. You must populate the invoice_milestones and operating_runway with actual numerical values calculated from the budget and duration.';
      const prompt = `Final Budget: $${finalBudget}, Duration: ${timelineWeeks} weeks. Generate invoice milestones and operating runway.`;
      ledgerData = await queryLLM(provider, model, prompt, systemPrompt);
    } catch (err) {
      console.error('[Ledger Agent error]', err);
      if (!sandboxMode) throw err;
      ledgerData = generateMockLedger(finalBudget, timelineWeeks);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1500));
    ledgerData = generateMockLedger(finalBudget, timelineWeeks);
  }

  // Commit Ledger write log to database
  await prisma.agentLog.create({
    data: {
      sessionId,
      agentName: 'Ledger Agent',
      status: 'SUCCESS',
      payload: JSON.stringify(ledgerData),
      message: 'Financial ledger metrics saved to database. Swarm pipeline finalized successfully.'
    }
  });

  // Mark WorkflowSession complete
  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  });

  // Attempt to broadcast to Band.ai
  if (!sandboxMode && process.env.BAND_LEDGER_AGENT_KEY) {
    try {
      const chatRoomSetting = await prisma.systemSetting.findUnique({
        where: { key: 'CHAT_ROOM_ID_' + sessionId }
      });
      if (chatRoomSetting && chatRoomSetting.value) {
        const targetMention = process.env.BAND_SCOPING_AGENT_ID || '';
        const milestonesList = ledgerData.invoice_milestones?.map(m => `• **${m.milestone_name}**: $${m.amount} (Due: ${m.due_date})`).join('\n') || 'None';
        const ledgerMsg = `💵 **Financial Ledger Finalized**\n\n` +
          `📈 **Total Allocated**: $${ledgerData.runway_breakdown?.total_funding_allocated || finalBudget}\n` +
          `🏦 **Operating Runway**: ${ledgerData.runway_breakdown?.monthly_burn_rate ? `$${ledgerData.runway_breakdown.monthly_burn_rate}/month` : 'N/A'}\n\n` +
          `📅 **Payment Milestones**:\n${milestonesList}`;
        await ledgerBandClient.sendMessage(
          chatRoomSetting.value, 
          ledgerMsg, 
          targetMention
        );
      }
    } catch (err) {
      console.warn('[Band.ai Ledger Broadcast Failed]', err.message);
    }
  }

  return ledgerData;
}

// --- Generators for fallback/mock structure matching schemas ---

function generateMockScoping(rawInput) {
  const isDoc = rawInput.includes('INGESTED DOCUMENT');
  
  // Extract keywords to make a dynamic title
  let project_name = 'Enterprise Swarm Deployment';
  if (rawInput.toLowerCase().includes('marketing')) {
    project_name = 'Digital Marketing Swarm';
  } else if (rawInput.toLowerCase().includes('server') || rawInput.toLowerCase().includes('cloud') || rawInput.toLowerCase().includes('maintenance')) {
    project_name = 'Cloud Infrastructure Optimization';
  } else if (rawInput.toLowerCase().includes('database') || rawInput.toLowerCase().includes('ledger') || rawInput.toLowerCase().includes('allocation')) {
    project_name = 'Financial Ledger Integration';
  } else if (isDoc) {
    project_name = 'Dynamic API Orchestration Portal';
  }

  return {
    project_name,
    budget: {
      amount: isDoc ? 13500 : 9500,
      currency: 'USD'
    },
    timeline: {
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 6 * 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDurationWeeks: 6
    },
    features: [
      { name: 'Multisig Safe Integration', description: 'Secure blockchain transactions with multi-signature validation', priority: 'high' },
      { name: 'Cross-chain Router', description: 'Enable token swaps/swarms routing across main networks', priority: 'medium' },
      { name: 'Telemetry Logging', description: 'Capture agent state and log SQLite metrics', priority: 'high' }
    ]
  };
}

function generateMockRisk(scopingData, complianceResult = null) {
  // If the compliance engine ran, use its results directly
  if (complianceResult && complianceResult.violations) {
    const flagged_risks = complianceResult.violations.slice(0, 6).map(v => ({
      category: v.category,
      severity: v.severity,
      description: `[${v.ruleId}] ${v.title}: ${v.description}`,
      mitigation_strategy: v.remediation
    }));

    // Ensure at least one risk is always present
    if (flagged_risks.length === 0) {
      flagged_risks.push({
        category: 'operational',
        severity: 'low',
        description: 'Minor dependency latency warnings.',
        mitigation_strategy: 'Implement exponential backoff.'
      });
    }

    return {
      risk_score: complianceResult.riskScore,
      flagged_risks,
      compliance_status: {
        status: complianceResult.overallStatus,
        certifications_checked: complianceResult.applicableFrameworks.map(f => f.name || f.id),
        notes: complianceResult.summary.split('\n').slice(0, 3).join(' ')
      }
    };
  }

  // Legacy fallback if no compliance engine result
  return {
    risk_score: 12,
    flagged_risks: [{
      category: 'operational',
      severity: 'low',
      description: 'Minor dependency latency warnings.',
      mitigation_strategy: 'Implement exponential backoff.'
    }],
    compliance_status: {
      status: 'compliant',
      certifications_checked: ['SOC2', 'GDPR'],
      notes: 'All features compliant.'
    }
  };
}

function generateMockLedger(budget, weeks) {
  const milestone1 = Math.round(budget * 0.4);
  const milestone2 = budget - milestone1;
  return {
    invoice_milestones: [
      { title: 'Project Kickoff & Environment Setup', amount: milestone1, target_date: new Date().toISOString(), status: 'paid' },
      { title: 'Final Deployment and Acceptance', amount: milestone2, target_date: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' }
    ],
    operating_runway: {
      months_remaining: 12,
      monthly_burn_rate: Math.round(budget / 3)
    },
    ledgerTxHash: '0x' + Math.random().toString(16).substr(2, 40),
    approvalStatus: 'AUTHORIZED_BY_ADMIN'
  };
}
