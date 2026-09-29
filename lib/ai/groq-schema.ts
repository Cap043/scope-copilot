const sourceReferenceSchema = {
  type: "object",
  properties: {
    quote: {
      type: "string",
    },
    section: {
      type: ["string", "null"],
    },
  },
  required: ["quote", "section"],
  additionalProperties: false,
} as const;

const scopeItemSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: ["string", "null"],
    },
    sourceReferences: {
      type: "array",
      items: sourceReferenceSchema,
    },
  },
  required: [
    "title",
    "description",
    "sourceReferences",
  ],
  additionalProperties: false,
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
  required: [
    "type",
    "limit",
    "sourceReferences",
  ],
  additionalProperties: false,
} as const;

const timelineSchema = {
  type: "object",
  properties: {
    duration: {
      type: ["string", "null"],
    },
    startCondition: {
      type: ["string", "null"],
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
  required: [
    "duration",
    "startCondition",
    "dependencies",
    "sourceReferences",
  ],
  additionalProperties: false,
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
  required: [
    "statement",
    "sourceReferences",
  ],
  additionalProperties: false,
} as const;

export const normalizedScopeGroqSchema = {
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

  additionalProperties: false,
} as const;