/**
 * Structured schema definitions and validation structures for the 3-agent orchestration pipeline.
 */

// 1. Scoping Agent Payload Structure
// raw text input turned into structured project scope, features, and timeline_weeks
export const ScopingPayload = {
  description: 'Structured representation of project scope generated from raw requirements.',
  fields: {
    rawInput: 'string (original user prompt/text)',
    projectName: 'string (short name)',
    summary: 'string (consolidated project description)',
    features: 'array of strings (individual features to build)',
    timelineWeeks: 'number (estimated duration of project)',
  },
  validate(data) {
    if (!data || typeof data !== 'object') return false;
    return (
      typeof data.rawInput === 'string' &&
      typeof data.projectName === 'string' &&
      typeof data.summary === 'string' &&
      Array.isArray(data.features) &&
      typeof data.timelineWeeks === 'number'
    );
  }
};

// 2. Risk Agent Payload Structure
// compliance flags, regulatory check status, risk mitigation text
export const RiskPayload = {
  description: 'Safety, compliance, and regulatory risk assessment payload.',
  fields: {
    complianceFlags: 'array of strings (flagged violations or risks)',
    regulatoryCheckStatus: 'string (e.g. APPROVED, WARNING, FAILED, PENDING_REVIEW)',
    riskMitigationText: 'string (mitigation plan/notes)',
    criticalityScore: 'number (0 to 10 scale of total operational risk)',
  },
  validate(data) {
    if (!data || typeof data !== 'object') return false;
    return (
      Array.isArray(data.complianceFlags) &&
      typeof data.regulatoryCheckStatus === 'string' &&
      typeof data.riskMitigationText === 'string' &&
      typeof data.criticalityScore === 'number'
    );
  }
};

// 3. Ledger Agent Payload Structure
// milestone payment breakdowns, final budget approvals
export const LedgerPayload = {
  description: 'Financial ledger allocations and budget milestones.',
  fields: {
    totalBudget: 'number (total cost)',
    milestones: 'array of objects ({ name: string, paymentPercent: number, budgetAmount: number })',
    approvalStatus: 'string (e.g. DRAFT, APPROVED, PENDING_MANUAL_OVERRIDE)',
    ledgerTxHash: 'string (simulated record transaction ID)',
  },
  validate(data) {
    if (!data || typeof data !== 'object') return false;
    const validMilestones = Array.isArray(data.milestones) && data.milestones.every(m => (
      m && typeof m.name === 'string' &&
      typeof m.paymentPercent === 'number' &&
      typeof m.budgetAmount === 'number'
    ));
    return (
      typeof data.totalBudget === 'number' &&
      validMilestones &&
      typeof data.approvalStatus === 'string' &&
      typeof data.ledgerTxHash === 'string'
    );
  }
};
