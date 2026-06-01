/**
 * JSON Schema for RiskAssessment payload.
 */
const riskAssessmentSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RiskAssessment",
  type: "object",
  description: "Payload assessing project risks and compliance state.",
  properties: {
    flagged_risks: {
      type: "array",
      description: "List of identified and assessed risks.",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Risk category (e.g., technical, operational, legal)."
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Severity level of the risk."
          },
          description: {
            type: "string",
            description: "Description of the risk event and its impact."
          },
          mitigation_strategy: {
            type: "string",
            description: "Planned actions to minimize risk impact."
          }
        },
        required: ["category", "severity", "description"],
        additionalProperties: false
      }
    },
    compliance_status: {
      type: "object",
      description: "Compliance validation state.",
      properties: {
        status: {
          type: "string",
          enum: ["compliant", "non-compliant", "pending"],
          description: "Overall compliance status."
        },
        certifications_checked: {
          type: "array",
          description: "Certifications or standards reviewed (e.g. SOC2, GDPR, HIPAA).",
          items: {
            type: "string"
          }
        },
        notes: {
          type: "string",
          description: "Compliance audit remarks."
        }
      },
      required: ["status"],
      additionalProperties: false
    }
  },
  required: ["flagged_risks", "compliance_status"],
  additionalProperties: false
};

module.exports = riskAssessmentSchema;
