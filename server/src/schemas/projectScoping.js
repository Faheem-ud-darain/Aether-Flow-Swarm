/**
 * JSON Schema for ProjectScoping payload.
 */
const projectScopingSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ProjectScoping",
  type: "object",
  description: "Payload detailing project budget, timeline, and scoping features.",
  properties: {
    budget: {
      type: "object",
      description: "Financial budget scoping.",
      properties: {
        amount: {
          type: "number",
          minimum: 0,
          description: "Total budget amount."
        },
        currency: {
          type: "string",
          default: "USD",
          description: "Currency code (ISO 4217)."
        }
      },
      required: ["amount"],
      additionalProperties: false
    },
    timeline: {
      type: "object",
      description: "Project timeframe constraints.",
      properties: {
        startDate: {
          type: "string",
          format: "date-time",
          description: "ISO date-time for project start."
        },
        endDate: {
          type: "string",
          format: "date-time",
          description: "ISO date-time for project completion."
        },
        estimatedDurationWeeks: {
          type: "integer",
          minimum: 1,
          description: "Estimated project duration in weeks."
        }
      },
      required: ["startDate", "endDate"],
      additionalProperties: false
    },
    features: {
      type: "array",
      description: "List of features scoped for development.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Feature name."
          },
          description: {
            type: "string",
            description: "Detailed description of the feature."
          },
          priority: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Implementation priority level."
          }
        },
        required: ["name"],
        additionalProperties: false
      }
    }
  },
  required: ["budget", "timeline", "features"],
  additionalProperties: false
};

module.exports = projectScopingSchema;
