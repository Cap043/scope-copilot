const sourceReferenceSchema = {
  type: "object",
  properties: {
    quote: {
      type: "string",
    },
    section: {
      type: "string",
    },
  },
  required: ["quote"],
} as const;

const scopeItemSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    sourceReferences: {
      type: "array",
      items: sourceReferenceSchema,
    },
  },
  required: ["title", "sourceReferences"],
} as const;

const revisionLimitSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
    },
    limit: {
      type: "string",
    },
    sourceReferences: {
      type: "array",
      items: sourceReferenceSchema,
    },
  },
  required: ["type", "limit", "sourceReferences"],
} as const;

const timelineSchema = {
  type: "object",
  properties: {
    duration: {
      type: "string",
    },
    startCondition: {
      type: "string",
    },
    dependencies: {
      type: "array",
      items: {
        type: "string",
      },
    },
    sourceReferences: {
      type: "array",
      items: sourceReferenceSchema,
    },
  },
  required: ["dependencies", "sourceReferences"],
} as const;

const assumptionSchema = {
  type: "object",
  properties: {
    statement: {
      type: "string",
    },
    sourceReferences: {
      type: "array",
      items: sourceReferenceSchema,
    },
  },
  required: ["statement", "sourceReferences"],
} as const;

export const normalizedScopeGeminiSchema = {
  type: "object",
  properties: {
    deliverables: {
      type: "array",
      items: scopeItemSchema,
    },

    features: {
      type: "array",
      items: scopeItemSchema,
    },

    exclusions: {
      type: "array",
      items: scopeItemSchema,
    },

    clientResponsibilities: {
      type: "array",
      items: scopeItemSchema,
    },

    revisionLimits: {
      type: "array",
      items: revisionLimitSchema,
    },

    timeline: timelineSchema,

    assumptions: {
      type: "array",
      items: assumptionSchema,
    },
  },

  required: [
    "deliverables",
    "features",
    "exclusions",
    "clientResponsibilities",
    "revisionLimits",
    "timeline",
    "assumptions",
  ],
} as const;