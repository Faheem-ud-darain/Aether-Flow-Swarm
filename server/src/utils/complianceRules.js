/**
 * ============================================================================
 *  COMPLIANCE RULES ENGINE — Aether Flow Swarm
 * ============================================================================
 *
 *  A structured rulebook that the Risk & Compliance Agent evaluates against
 *  every scoped project. Each rule belongs to a regulatory framework, carries
 *  a severity weight, and provides concrete remediation guidance.
 *
 *  Supported Frameworks:
 *    • GDPR   – EU General Data Protection Regulation
 *    • SOC2   – Service Organisation Control Type 2 (Trust Services Criteria)
 *    • HIPAA  – Health Insurance Portability & Accountability Act
 *    • PCI-DSS – Payment Card Industry Data Security Standard
 *    • ISO-27001 – Information Security Management Systems
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1.  FRAMEWORK DEFINITIONS
// ---------------------------------------------------------------------------

export const COMPLIANCE_FRAMEWORKS = {
  GDPR: {
    id: 'GDPR',
    name: 'General Data Protection Regulation',
    jurisdiction: 'European Union / EEA',
    description: 'Protects personal data and privacy of EU citizens. Applies to any system that stores, processes, or transmits personal data of EU residents.',
    applicableTriggers: [
      'personal data', 'PII', 'user data', 'client data', 'customer records',
      'email addresses', 'GDPR', 'EU citizens', 'data subject', 'consent',
      'data processing', 'data controller', 'data processor', 'right to erasure'
    ]
  },
  SOC2: {
    id: 'SOC2',
    name: 'SOC 2 Type II — Trust Services Criteria',
    jurisdiction: 'United States / Global SaaS',
    description: 'Evaluates controls related to security, availability, processing integrity, confidentiality, and privacy for service organizations.',
    applicableTriggers: [
      'SOC2', 'SOC 2', 'audit', 'logging', 'access control', 'monitoring',
      'availability', 'uptime', 'incident response', 'change management',
      'SaaS', 'cloud service', 'multi-tenant'
    ]
  },
  HIPAA: {
    id: 'HIPAA',
    name: 'Health Insurance Portability & Accountability Act',
    jurisdiction: 'United States',
    description: 'Protects sensitive patient health information (PHI). Applies to healthcare providers, health plans, clearinghouses, and business associates.',
    applicableTriggers: [
      'HIPAA', 'health', 'medical', 'patient', 'PHI', 'clinical',
      'hospital', 'healthcare', 'diagnosis', 'treatment', 'prescription',
      'electronic health record', 'EHR', 'ePHI'
    ]
  },
  PCI_DSS: {
    id: 'PCI_DSS',
    name: 'Payment Card Industry Data Security Standard',
    jurisdiction: 'Global',
    description: 'Secures credit card transactions and cardholder data. Applies to any entity that stores, processes, or transmits cardholder data.',
    applicableTriggers: [
      'PCI', 'payment', 'credit card', 'cardholder', 'payment gateway',
      'transaction', 'billing', 'stripe', 'checkout', 'card number',
      'CVV', 'PAN', 'tokenization'
    ]
  },
  ISO_27001: {
    id: 'ISO_27001',
    name: 'ISO/IEC 27001 — Information Security Management',
    jurisdiction: 'International',
    description: 'Provides requirements for establishing, implementing, maintaining, and continually improving an information security management system (ISMS).',
    applicableTriggers: [
      'ISO 27001', 'ISMS', 'information security', 'security policy',
      'risk assessment', 'asset management', 'access control', 'cryptography',
      'physical security', 'incident management', 'business continuity'
    ]
  }
};

// ---------------------------------------------------------------------------
// 2.  COMPLIANCE RULES
// ---------------------------------------------------------------------------

export const COMPLIANCE_RULES = [

  // ═══════════════════════════════════════════════════════════════════════════
  // GDPR RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'GDPR-001',
    framework: 'GDPR',
    title: 'Data Processing Lawful Basis',
    category: 'legal',
    severity: 'critical',
    description: 'Any system processing personal data MUST have a documented lawful basis (consent, contract, legal obligation, vital interests, public task, or legitimate interests) under GDPR Article 6.',
    checkKeywords: ['personal data', 'PII', 'user data', 'client data', 'customer records', 'data processing'],
    remediation: 'Document the lawful basis for processing in the project scope. Implement a consent management module if relying on consent. Add a Data Processing Agreement (DPA) template.',
    scoreWeight: 25
  },
  {
    id: 'GDPR-002',
    framework: 'GDPR',
    title: 'Right to Erasure (Right to be Forgotten)',
    category: 'legal',
    severity: 'high',
    description: 'Systems storing personal data MUST implement mechanisms for data subjects to request complete deletion of their records under GDPR Article 17.',
    checkKeywords: ['personal data', 'user data', 'client data', 'database', 'storage', 'records'],
    remediation: 'Implement a data deletion API endpoint. Ensure cascading deletes across all related tables. Add audit logging for deletion requests.',
    scoreWeight: 20
  },
  {
    id: 'GDPR-003',
    framework: 'GDPR',
    title: 'Data Portability',
    category: 'legal',
    severity: 'medium',
    description: 'Data subjects have the right to receive their personal data in a structured, machine-readable format under GDPR Article 20.',
    checkKeywords: ['personal data', 'user data', 'export', 'data portability'],
    remediation: 'Implement a data export endpoint that outputs user data in JSON or CSV format. Document the export schema in API documentation.',
    scoreWeight: 10
  },
  {
    id: 'GDPR-004',
    framework: 'GDPR',
    title: 'Data Breach Notification',
    category: 'operational',
    severity: 'critical',
    description: 'Personal data breaches MUST be reported to the supervisory authority within 72 hours under GDPR Article 33. Affected data subjects must be notified without undue delay when there is a high risk.',
    checkKeywords: ['personal data', 'security', 'breach', 'incident'],
    remediation: 'Implement an incident response plan with a 72-hour notification workflow. Create breach detection monitoring. Maintain a breach register.',
    scoreWeight: 25
  },
  {
    id: 'GDPR-005',
    framework: 'GDPR',
    title: 'Data Minimisation',
    category: 'technical',
    severity: 'medium',
    description: 'Only collect and process personal data that is strictly necessary for the specified purpose under GDPR Article 5(1)(c).',
    checkKeywords: ['data collection', 'personal data', 'user data', 'forms', 'registration'],
    remediation: 'Audit all data collection points. Remove unnecessary fields. Document purpose limitation for each data element.',
    scoreWeight: 10
  },
  {
    id: 'GDPR-006',
    framework: 'GDPR',
    title: 'Cross-Border Data Transfer',
    category: 'legal',
    severity: 'high',
    description: 'Transferring personal data outside the EU/EEA requires appropriate safeguards (Standard Contractual Clauses, adequacy decisions, or Binding Corporate Rules) under GDPR Chapter V.',
    checkKeywords: ['cross-border', 'international', 'cloud', 'AWS', 'Azure', 'GCP', 'US server', 'data transfer'],
    remediation: 'Implement Standard Contractual Clauses (SCCs) for third-party processors. Conduct a Transfer Impact Assessment (TIA). Consider EU-based hosting.',
    scoreWeight: 20
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOC2 RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'SOC2-001',
    framework: 'SOC2',
    title: 'Logical Access Controls',
    category: 'technical',
    severity: 'critical',
    description: 'All systems MUST implement role-based access control (RBAC). Administrative access must require multi-factor authentication (MFA). Access reviews must be conducted quarterly.',
    checkKeywords: ['access control', 'authentication', 'login', 'admin', 'roles', 'permissions', 'RBAC'],
    remediation: 'Implement RBAC with least-privilege principle. Enforce MFA for admin accounts. Schedule quarterly access reviews. Log all authentication events.',
    scoreWeight: 25
  },
  {
    id: 'SOC2-002',
    framework: 'SOC2',
    title: 'Audit Trail & Logging',
    category: 'operational',
    severity: 'critical',
    description: 'All system events, data modifications, and access attempts MUST be logged in an immutable audit trail. Logs must be retained for a minimum of 12 months.',
    checkKeywords: ['audit', 'logging', 'audit trail', 'monitoring', 'events', 'telemetry'],
    remediation: 'Implement centralized logging (e.g., ELK stack, Datadog). Ensure log immutability via write-once storage. Set log retention policy to ≥12 months.',
    scoreWeight: 25
  },
  {
    id: 'SOC2-003',
    framework: 'SOC2',
    title: 'Incident Response Plan',
    category: 'operational',
    severity: 'high',
    description: 'A documented incident response plan MUST exist covering identification, containment, eradication, recovery, and post-incident review.',
    checkKeywords: ['incident', 'response', 'security', 'breach', 'alert', 'monitoring'],
    remediation: 'Draft and maintain an Incident Response Plan (IRP). Conduct tabletop exercises annually. Define escalation paths and communication protocols.',
    scoreWeight: 20
  },
  {
    id: 'SOC2-004',
    framework: 'SOC2',
    title: 'Change Management Controls',
    category: 'operational',
    severity: 'high',
    description: 'All changes to production systems MUST follow a documented change management process including peer review, testing, and approval.',
    checkKeywords: ['deployment', 'CI/CD', 'release', 'production', 'change management', 'version control'],
    remediation: 'Implement a change management policy. Require pull request reviews. Enforce staging environment testing before production deployment.',
    scoreWeight: 15
  },
  {
    id: 'SOC2-005',
    framework: 'SOC2',
    title: 'Encryption at Rest & in Transit',
    category: 'technical',
    severity: 'critical',
    description: 'All sensitive data MUST be encrypted at rest (AES-256 or equivalent) and in transit (TLS 1.2+). Encryption keys must be managed via a dedicated key management service.',
    checkKeywords: ['encryption', 'data at rest', 'data in transit', 'TLS', 'SSL', 'HTTPS', 'database', 'storage'],
    remediation: 'Enable TLS 1.2+ for all connections. Encrypt database storage at rest. Use a KMS (Key Management Service) for key rotation.',
    scoreWeight: 25
  },
  {
    id: 'SOC2-006',
    framework: 'SOC2',
    title: 'System Availability & Uptime',
    category: 'operational',
    severity: 'medium',
    description: 'Production systems MUST maintain documented SLAs with ≥99.5% uptime targets. Disaster recovery and backup procedures must be tested annually.',
    checkKeywords: ['availability', 'uptime', 'SLA', 'disaster recovery', 'backup', 'redundancy'],
    remediation: 'Define and publish SLA targets. Implement automated backups with tested restore procedures. Deploy across multiple availability zones.',
    scoreWeight: 15
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HIPAA RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'HIPAA-001',
    framework: 'HIPAA',
    title: 'Protected Health Information (PHI) Safeguards',
    category: 'technical',
    severity: 'critical',
    description: 'All electronic PHI (ePHI) MUST be protected with administrative, physical, and technical safeguards as required by the HIPAA Security Rule (45 CFR Part 164).',
    checkKeywords: ['health', 'medical', 'patient', 'PHI', 'clinical', 'diagnosis', 'treatment', 'ePHI'],
    remediation: 'Implement access controls, audit controls, integrity controls, and transmission security for all ePHI. Conduct a HIPAA Security Risk Assessment.',
    scoreWeight: 30
  },
  {
    id: 'HIPAA-002',
    framework: 'HIPAA',
    title: 'Business Associate Agreement (BAA)',
    category: 'legal',
    severity: 'critical',
    description: 'Any third-party vendor or subcontractor with access to PHI MUST sign a Business Associate Agreement under HIPAA §164.502(e).',
    checkKeywords: ['third-party', 'vendor', 'subcontractor', 'cloud provider', 'API', 'health', 'medical'],
    remediation: 'Execute BAAs with all vendors handling PHI. Maintain a vendor inventory. Review BAAs annually.',
    scoreWeight: 25
  },
  {
    id: 'HIPAA-003',
    framework: 'HIPAA',
    title: 'Minimum Necessary Standard',
    category: 'operational',
    severity: 'high',
    description: 'Access to PHI MUST be limited to the minimum necessary to accomplish the intended purpose under HIPAA §164.502(b).',
    checkKeywords: ['access', 'PHI', 'roles', 'permissions', 'health data', 'patient records'],
    remediation: 'Implement role-based access with minimum necessary policies. Audit access logs regularly. Train staff on minimum necessary requirements.',
    scoreWeight: 20
  },
  {
    id: 'HIPAA-004',
    framework: 'HIPAA',
    title: 'Breach Notification Rule',
    category: 'operational',
    severity: 'critical',
    description: 'Breaches of unsecured PHI affecting 500+ individuals MUST be reported to HHS within 60 days. Individual notification must occur without unreasonable delay.',
    checkKeywords: ['breach', 'incident', 'PHI', 'notification', 'health data'],
    remediation: 'Establish breach detection and notification procedures. Maintain a breach log. Train incident response team on HIPAA notification timelines.',
    scoreWeight: 25
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PCI-DSS RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'PCI-001',
    framework: 'PCI_DSS',
    title: 'Cardholder Data Protection',
    category: 'technical',
    severity: 'critical',
    description: 'Cardholder data (PAN, CVV, expiry) MUST NOT be stored in plaintext. PAN must be masked when displayed. CVV/CVC must never be stored post-authorization.',
    checkKeywords: ['payment', 'credit card', 'cardholder', 'PAN', 'CVV', 'card number', 'billing'],
    remediation: 'Tokenize cardholder data via a PCI-compliant payment processor (e.g., Stripe, Braintree). Never store raw card numbers. Mask PAN to show only last 4 digits.',
    scoreWeight: 30
  },
  {
    id: 'PCI-002',
    framework: 'PCI_DSS',
    title: 'Network Segmentation',
    category: 'technical',
    severity: 'high',
    description: 'Systems processing cardholder data MUST be isolated in a segmented network zone (Cardholder Data Environment — CDE) with firewall rules restricting access.',
    checkKeywords: ['payment', 'network', 'firewall', 'segmentation', 'CDE', 'cardholder'],
    remediation: 'Segment the cardholder data environment from general networks. Implement firewall rules. Document network architecture diagrams.',
    scoreWeight: 20
  },
  {
    id: 'PCI-003',
    framework: 'PCI_DSS',
    title: 'Vulnerability Management',
    category: 'technical',
    severity: 'high',
    description: 'Systems MUST run regular vulnerability scans (quarterly ASV scans for external, internal scans as needed) and apply security patches within 30 days of release.',
    checkKeywords: ['vulnerability', 'scanning', 'patching', 'security updates', 'payment'],
    remediation: 'Schedule quarterly ASV scans. Implement a patch management policy with 30-day SLA. Use SAST/DAST tools in CI/CD.',
    scoreWeight: 20
  },
  {
    id: 'PCI-004',
    framework: 'PCI_DSS',
    title: 'Strong Access Control Measures',
    category: 'technical',
    severity: 'critical',
    description: 'Access to cardholder data MUST be restricted on a need-to-know basis. Unique IDs must be assigned to each person with computer access. Physical access must be restricted.',
    checkKeywords: ['access control', 'authentication', 'cardholder', 'payment', 'unique ID'],
    remediation: 'Enforce unique user IDs. Implement MFA for CDE access. Maintain access control lists. Log all access to cardholder data.',
    scoreWeight: 25
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ISO 27001 RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ISO-001',
    framework: 'ISO_27001',
    title: 'Information Security Policy',
    category: 'operational',
    severity: 'high',
    description: 'An organisation-level Information Security Policy MUST be established, approved by management, published, and communicated to all employees and relevant external parties.',
    checkKeywords: ['security policy', 'information security', 'ISMS', 'governance'],
    remediation: 'Draft an Information Security Policy aligned with ISO 27001 Annex A. Obtain management sign-off. Distribute to all stakeholders.',
    scoreWeight: 15
  },
  {
    id: 'ISO-002',
    framework: 'ISO_27001',
    title: 'Risk Assessment & Treatment',
    category: 'operational',
    severity: 'critical',
    description: 'A formal risk assessment process MUST be established to identify, analyze, and evaluate information security risks. A risk treatment plan must address all unacceptable risks.',
    checkKeywords: ['risk assessment', 'risk management', 'threat', 'vulnerability', 'risk treatment'],
    remediation: 'Conduct a formal risk assessment. Maintain a risk register. Define risk acceptance criteria. Create treatment plans for high/critical risks.',
    scoreWeight: 25
  },
  {
    id: 'ISO-003',
    framework: 'ISO_27001',
    title: 'Asset Management',
    category: 'operational',
    severity: 'medium',
    description: 'All information assets MUST be identified, classified, and assigned an owner. An asset inventory must be maintained and regularly reviewed.',
    checkKeywords: ['asset', 'inventory', 'classification', 'data classification', 'ownership'],
    remediation: 'Create and maintain an information asset inventory. Classify assets by sensitivity. Assign ownership. Review quarterly.',
    scoreWeight: 10
  },
  {
    id: 'ISO-004',
    framework: 'ISO_27001',
    title: 'Business Continuity Planning',
    category: 'operational',
    severity: 'high',
    description: 'Business continuity plans MUST be established, implemented, and tested to ensure availability of information and systems during disruptive events.',
    checkKeywords: ['business continuity', 'disaster recovery', 'backup', 'failover', 'resilience'],
    remediation: 'Develop a Business Continuity Plan (BCP). Implement disaster recovery procedures. Test BCP annually. Define RTO and RPO targets.',
    scoreWeight: 20
  }
];

// ---------------------------------------------------------------------------
// 3.  BUDGET & OPERATIONAL THRESHOLDS
// ---------------------------------------------------------------------------

export const OPERATIONAL_THRESHOLDS = {
  budget: {
    warningLimit: 10000,     // Budget above this triggers a medium-severity warning
    criticalLimit: 25000,    // Budget above this triggers a critical flag + HITL
    currencyDefault: 'USD'
  },
  timeline: {
    maxWeeksWarning: 12,     // Timelines >12 weeks flag a timeline risk
    maxWeeksCritical: 26     // Timelines >26 weeks flag a critical timeline risk
  },
  features: {
    maxHighPriority: 5,      // More than 5 high-priority features trigger scope creep warning
    minFeatureCount: 1       // At least 1 feature must be scoped
  },
  apiDependencies: {
    maxExternalAPIs: 3,      // More than 3 external API dependencies trigger vendor risk
    triggerKeywords: ['API', 'third-party', 'external service', 'webhook', 'integration']
  }
};

// ---------------------------------------------------------------------------
// 4.  COMPLIANCE EVALUATION ENGINE
// ---------------------------------------------------------------------------

/**
 * Detects which compliance frameworks apply to a project based on keyword
 * analysis of the raw input text and scoped features.
 *
 * @param {string} rawInput - The original project requirement text.
 * @param {object} scopingData - The parsed scoping output from the Scoping Agent.
 * @returns {string[]} - Array of applicable framework IDs.
 */
export function detectApplicableFrameworks(rawInput, scopingData) {
  const combinedText = [
    rawInput,
    JSON.stringify(scopingData.features || []),
    scopingData.project_name || ''
  ].join(' ').toLowerCase();

  const applicable = [];

  for (const [id, framework] of Object.entries(COMPLIANCE_FRAMEWORKS)) {
    const matches = framework.applicableTriggers.filter(
      trigger => combinedText.includes(trigger.toLowerCase())
    );
    if (matches.length > 0) {
      applicable.push(id);
    }
  }

  // GDPR and SOC2 are always checked as baseline (industry default)
  if (!applicable.includes('GDPR')) applicable.push('GDPR');
  if (!applicable.includes('SOC2')) applicable.push('SOC2');

  return [...new Set(applicable)];
}

/**
 * Evaluates all compliance rules for the applicable frameworks against
 * the project's raw input and scoped features. Returns triggered violations.
 *
 * @param {string} rawInput - Original project requirement text.
 * @param {object} scopingData - Parsed scoping output.
 * @param {string[]} frameworks - Applicable framework IDs.
 * @returns {object} - { violations, score, applicableFrameworks, summary }
 */
export function evaluateCompliance(rawInput, scopingData, frameworks = null) {
  const applicableFrameworks = frameworks || detectApplicableFrameworks(rawInput, scopingData);

  const combinedText = [
    rawInput,
    JSON.stringify(scopingData.features || []),
    scopingData.project_name || ''
  ].join(' ').toLowerCase();

  const violations = [];
  let totalWeight = 0;
  let violatedWeight = 0;

  // Filter rules to applicable frameworks
  const applicableRules = COMPLIANCE_RULES.filter(
    rule => applicableFrameworks.includes(rule.framework)
  );

  for (const rule of applicableRules) {
    totalWeight += rule.scoreWeight;

    // Check if the project context triggers this rule
    const triggerMatches = rule.checkKeywords.filter(
      kw => combinedText.includes(kw.toLowerCase())
    );

    if (triggerMatches.length > 0) {
      // Rule is relevant — flag it as a compliance requirement
      violations.push({
        ruleId: rule.id,
        framework: rule.framework,
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
        remediation: rule.remediation,
        matchedKeywords: triggerMatches,
        scoreImpact: rule.scoreWeight
      });
      violatedWeight += rule.scoreWeight;
    }
  }

  // ------ Operational threshold checks ------
  const budgetAmount = scopingData.budget?.amount || 0;
  const timelineWeeks = scopingData.timeline?.estimatedDurationWeeks || 0;
  const features = scopingData.features || [];
  const highPriorityCount = features.filter(f => f.priority === 'high').length;

  if (budgetAmount > OPERATIONAL_THRESHOLDS.budget.criticalLimit) {
    violations.push({
      ruleId: 'OPS-BUDGET-CRIT',
      framework: 'OPERATIONAL',
      title: 'Critical Budget Threshold Exceeded',
      category: 'financial',
      severity: 'critical',
      description: `Proposed budget ($${budgetAmount}) exceeds the critical threshold of $${OPERATIONAL_THRESHOLDS.budget.criticalLimit}. Requires executive-level Human-in-the-Loop approval.`,
      remediation: 'Submit budget justification for executive review. Consider phased rollout to reduce upfront costs.',
      matchedKeywords: ['budget'],
      scoreImpact: 25
    });
    violatedWeight += 25;
    totalWeight += 25;
  } else if (budgetAmount > OPERATIONAL_THRESHOLDS.budget.warningLimit) {
    violations.push({
      ruleId: 'OPS-BUDGET-WARN',
      framework: 'OPERATIONAL',
      title: 'Budget Warning Threshold',
      category: 'financial',
      severity: 'medium',
      description: `Proposed budget ($${budgetAmount}) exceeds warning threshold of $${OPERATIONAL_THRESHOLDS.budget.warningLimit}.`,
      remediation: 'Review budget allocation. Ensure cost justification is documented for each line item.',
      matchedKeywords: ['budget'],
      scoreImpact: 10
    });
    violatedWeight += 10;
    totalWeight += 10;
  }

  if (timelineWeeks > OPERATIONAL_THRESHOLDS.timeline.maxWeeksCritical) {
    violations.push({
      ruleId: 'OPS-TIMELINE-CRIT',
      framework: 'OPERATIONAL',
      title: 'Critical Timeline Overrun',
      category: 'operational',
      severity: 'high',
      description: `Estimated duration (${timelineWeeks} weeks) exceeds the critical limit of ${OPERATIONAL_THRESHOLDS.timeline.maxWeeksCritical} weeks.`,
      remediation: 'Break the project into phases. Prioritize MVP features for Phase 1.',
      matchedKeywords: ['timeline'],
      scoreImpact: 20
    });
    violatedWeight += 20;
    totalWeight += 20;
  } else if (timelineWeeks > OPERATIONAL_THRESHOLDS.timeline.maxWeeksWarning) {
    violations.push({
      ruleId: 'OPS-TIMELINE-WARN',
      framework: 'OPERATIONAL',
      title: 'Extended Timeline Warning',
      category: 'operational',
      severity: 'medium',
      description: `Estimated duration (${timelineWeeks} weeks) exceeds the advisory limit of ${OPERATIONAL_THRESHOLDS.timeline.maxWeeksWarning} weeks.`,
      remediation: 'Evaluate whether timeline can be compressed. Consider parallel workstreams.',
      matchedKeywords: ['timeline'],
      scoreImpact: 10
    });
    violatedWeight += 10;
    totalWeight += 10;
  }

  if (highPriorityCount > OPERATIONAL_THRESHOLDS.features.maxHighPriority) {
    violations.push({
      ruleId: 'OPS-SCOPE-CREEP',
      framework: 'OPERATIONAL',
      title: 'Scope Creep — Excessive High-Priority Features',
      category: 'operational',
      severity: 'medium',
      description: `${highPriorityCount} high-priority features detected (limit: ${OPERATIONAL_THRESHOLDS.features.maxHighPriority}). Risk of scope creep and resource exhaustion.`,
      remediation: 'Re-prioritize features. Move non-essential items to Phase 2. Apply MoSCoW prioritization framework.',
      matchedKeywords: ['features', 'priority'],
      scoreImpact: 10
    });
    violatedWeight += 10;
    totalWeight += 10;
  }

  // ------ Calculate compliance risk score (0-100) ------
  // Higher score = more risk
  const riskScore = totalWeight > 0
    ? Math.min(100, Math.round((violatedWeight / totalWeight) * 100))
    : 0;

  // ------ Determine overall status ------
  const hasCritical = violations.some(v => v.severity === 'critical');
  const hasHigh = violations.some(v => v.severity === 'high');
  const overallStatus = hasCritical ? 'non-compliant'
    : hasHigh ? 'pending'
    : violations.length > 0 ? 'compliant'
    : 'compliant';

  return {
    riskScore,
    overallStatus,
    applicableFrameworks: applicableFrameworks.map(id => ({
      id,
      name: COMPLIANCE_FRAMEWORKS[id]?.name || id
    })),
    totalRulesEvaluated: applicableRules.length,
    violationsFound: violations.length,
    violations,
    summary: generateComplianceSummary(violations, applicableFrameworks, riskScore, overallStatus)
  };
}

// ---------------------------------------------------------------------------
// 5.  SUMMARY GENERATOR
// ---------------------------------------------------------------------------

/**
 * Generates a human-readable compliance summary for the LLM prompt context.
 */
function generateComplianceSummary(violations, frameworks, score, status) {
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  const mediumCount = violations.filter(v => v.severity === 'medium').length;
  const lowCount = violations.filter(v => v.severity === 'low').length;

  return [
    `COMPLIANCE AUDIT SUMMARY`,
    `========================`,
    `Frameworks Evaluated: ${frameworks.join(', ')}`,
    `Overall Status: ${status.toUpperCase()}`,
    `Risk Score: ${score}/100`,
    ``,
    `Violations Breakdown:`,
    `  Critical: ${criticalCount}`,
    `  High: ${highCount}`,
    `  Medium: ${mediumCount}`,
    `  Low: ${lowCount}`,
    ``,
    ...(violations.length > 0 ? [
      `Top Issues:`,
      ...violations
        .filter(v => v.severity === 'critical' || v.severity === 'high')
        .slice(0, 5)
        .map(v => `  [${v.ruleId}] ${v.title} (${v.severity}) — ${v.description.slice(0, 120)}`)
    ] : ['  No compliance violations detected.'])
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 6.  COMPLIANCE POLICY STRING BUILDER (for LLM Prompt Injection)
// ---------------------------------------------------------------------------

/**
 * Builds a compact compliance policy string that can be injected into
 * the Risk Agent's LLM system prompt. This replaces the simple hardcoded
 * policy string that was previously used.
 *
 * @param {string[]} frameworkIds - Active framework IDs.
 * @returns {string} - Formatted policy text for LLM context.
 */
export function buildCompliancePolicyPrompt(frameworkIds) {
  const rules = COMPLIANCE_RULES.filter(r => frameworkIds.includes(r.framework));

  const lines = [
    'ACTIVE COMPLIANCE RULES FOR THIS PROJECT:',
    '==========================================',
    ''
  ];

  for (const fwId of frameworkIds) {
    const fw = COMPLIANCE_FRAMEWORKS[fwId];
    if (!fw) continue;

    const fwRules = rules.filter(r => r.framework === fwId);
    lines.push(`[${fw.id}] ${fw.name} (${fw.jurisdiction})`);
    lines.push(`  ${fw.description}`);
    lines.push('');

    for (const rule of fwRules) {
      lines.push(`  ${rule.id}: ${rule.title} [${rule.severity.toUpperCase()}]`);
      lines.push(`    → ${rule.description}`);
      lines.push(`    → Remediation: ${rule.remediation}`);
      lines.push('');
    }
  }

  lines.push('OPERATIONAL THRESHOLDS:');
  lines.push(`  Budget Warning: >${OPERATIONAL_THRESHOLDS.budget.warningLimit} USD`);
  lines.push(`  Budget Critical: >${OPERATIONAL_THRESHOLDS.budget.criticalLimit} USD`);
  lines.push(`  Timeline Warning: >${OPERATIONAL_THRESHOLDS.timeline.maxWeeksWarning} weeks`);
  lines.push(`  Timeline Critical: >${OPERATIONAL_THRESHOLDS.timeline.maxWeeksCritical} weeks`);
  lines.push(`  Max High-Priority Features: ${OPERATIONAL_THRESHOLDS.features.maxHighPriority}`);

  return lines.join('\n');
}
