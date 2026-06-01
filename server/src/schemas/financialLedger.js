/**
 * JSON Schema for FinancialLedger payload.
 */
const financialLedgerSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "FinancialLedger",
  type: "object",
  description: "Payload tracking invoice milestones and operating runway.",
  properties: {
    invoice_milestones: {
      type: "array",
      description: "Billing and invoice schedule checkpoints.",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Milestone identifier or description."
          },
          amount: {
            type: "number",
            minimum: 0,
            description: "Invoice amount."
          },
          target_date: {
            type: "string",
            format: "date-time",
            description: "ISO date-time target for invoicing."
          },
          status: {
            type: "string",
            enum: ["pending", "invoiced", "paid"],
            description: "Current payment/billing state."
          }
        },
        required: ["title", "amount", "status"],
        additionalProperties: false
      }
    },
    operating_runway: {
      type: "object",
      description: "Runway calculation details.",
      properties: {
        months_remaining: {
          type: "number",
          minimum: 0,
          description: "Calculated remaining operating runway in months."
        },
        monthly_burn_rate: {
          type: "number",
          minimum: 0,
          description: "Average monthly operating expense."
        }
      },
      required: ["months_remaining"],
      additionalProperties: false
    }
  },
  required: ["invoice_milestones", "operating_runway"],
  additionalProperties: false
};

module.exports = financialLedgerSchema;
