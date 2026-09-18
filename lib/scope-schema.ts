import { z } from "zod";

const sourceReferenceSchema = z.object({
  quote: z.string().min(1),
  section: z.string().optional(),
});

/* -------------------------------------------------------------------------- */
/* Extraction contract                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Gemini only extracts facts from the supplied SOW.
 *
 * It does not know about persistent IDs, amendments, or version lifecycle.
 */
const extractedScopeItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceReferences: z.array(sourceReferenceSchema),
});

const extractedRevisionLimitSchema = z.object({
  type: z.string().min(1),
  limit: z.string().min(1),
  sourceReferences: z.array(sourceReferenceSchema),
});

const extractedTimelineSchema = z.object({
  duration: z.string().optional(),
  startCondition: z.string().optional(),
  dependencies: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
});

const extractedAssumptionSchema = z.object({
  statement: z.string().min(1),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const extractedScopeSchema = z.object({
  deliverables: z.array(extractedScopeItemSchema),
  features: z.array(extractedScopeItemSchema),
  exclusions: z.array(extractedScopeItemSchema),
  clientResponsibilities: z.array(extractedScopeItemSchema),
  revisionLimits: z.array(extractedRevisionLimitSchema),
  timeline: extractedTimelineSchema,
  assumptions: z.array(extractedAssumptionSchema),
});

export type ExtractedScope = z.infer<
  typeof extractedScopeSchema
>;

/* -------------------------------------------------------------------------- */
/* Persisted scope contract                                                   */
/* -------------------------------------------------------------------------- */

const documentExtractionProvenanceSchema = z
  .object({
    type: z.literal("document_extraction"),
  })
  .strict();

const manualAmendmentProvenanceSchema = z
  .object({
    type: z.literal("manual_amendment"),
    rationale: z.string().trim().min(1),
    referenceId: z.string().trim().min(1),
  })
  .strict();

const provenanceSchema = z.discriminatedUnion("type", [
  documentExtractionProvenanceSchema,
  manualAmendmentProvenanceSchema,
]);

const amendmentSchema = z
  .object({
    rationale: z.string().trim().min(1),
    referenceId: z.string().trim().min(1),
  })
  .strict();

const removalSchema = z
  .object({
    rationale: z.string().trim().min(1),
    referenceId: z.string().trim().min(1),
  })
  .strict();

const persistedScopeItemBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),

  sourceReferences: z.array(sourceReferenceSchema),

  provenance: provenanceSchema,

  status: z.enum(["active", "removed"]),

  amendment: amendmentSchema.optional(),

  removal: removalSchema.optional(),
});

const persistedScopeItemSchema =
  persistedScopeItemBaseSchema.superRefine(
    (item, context) => {
      if (
        item.provenance.type ===
          "document_extraction" &&
        item.sourceReferences.length === 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceReferences"],
          message:
            "Document-extracted items must contain at least one source reference.",
        });
      }

      if (
        item.provenance.type ===
          "manual_amendment" &&
        item.sourceReferences.length > 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceReferences"],
          message:
            "Manual amendments cannot contain document source references.",
        });
      }

      // A manually added item stores its rationale/reference directly
      // inside provenance. A second amendment record would duplicate that
      // same meaning.
      if (
        item.provenance.type ===
          "manual_amendment" &&
        item.amendment
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amendment"],
          message:
            "Manual amendments cannot also contain amendment metadata.",
        });
      }

      if (
        item.status === "removed" &&
        !item.removal
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["removal"],
          message:
            "Removed items must contain removal metadata.",
        });
      }

      if (
        item.status === "active" &&
        item.removal
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["removal"],
          message:
            "Active items cannot contain removal metadata.",
        });
      }
    },
  );

const persistedRevisionLimitSchema =
  z
    .object({
      id: z.string().min(1),
      type: z.string().min(1),
      limit: z.string().min(1),

      sourceReferences: z.array(
        sourceReferenceSchema,
      ),

      provenance: provenanceSchema,

      status: z.enum(["active", "removed"]),

      amendment: amendmentSchema.optional(),

      removal: removalSchema.optional(),
    })
    .superRefine((item, context) => {
      if (
        item.provenance.type ===
          "document_extraction" &&
        item.sourceReferences.length === 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceReferences"],
          message:
            "Document-extracted revision limits must contain at least one source reference.",
        });
      }

      if (
        item.provenance.type ===
          "manual_amendment" &&
        item.sourceReferences.length > 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceReferences"],
          message:
            "Manual revision-limit amendments cannot contain document source references.",
        });
      }

      if (
        item.provenance.type ===
          "manual_amendment" &&
        item.amendment
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amendment"],
          message:
            "Manual amendments cannot also contain amendment metadata.",
        });
      }

      if (
        item.status === "removed" &&
        !item.removal
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["removal"],
          message:
            "Removed revision limits must contain removal metadata.",
        });
      }

      if (
        item.status === "active" &&
        item.removal
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["removal"],
          message:
            "Active revision limits cannot contain removal metadata.",
        });
      }
    });

const persistedAssumptionSchema = z
  .object({
    id: z.string().min(1),

    statement: z.string().min(1),

    sourceReferences: z.array(
      sourceReferenceSchema,
    ),

    provenance: provenanceSchema,

    status: z.enum([
      "active",
      "removed",
    ]),

    amendment: amendmentSchema.optional(),

    removal: removalSchema.optional(),
  })
  .superRefine((item, context) => {
    if (
      item.provenance.type ===
        "document_extraction" &&
      item.sourceReferences.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceReferences"],
        message:
          "Document-extracted assumptions must contain at least one source reference.",
      });
    }

    if (
      item.provenance.type ===
        "manual_amendment" &&
      item.sourceReferences.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceReferences"],
        message:
          "Manual assumption amendments cannot contain document source references.",
      });
    }

    if (
      item.provenance.type ===
        "manual_amendment" &&
      item.amendment
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amendment"],
        message:
          "Manual amendments cannot also contain amendment metadata.",
      });
    }

    if (
      item.status === "removed" &&
      !item.removal
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["removal"],
        message:
          "Removed assumptions must contain removal metadata.",
      });
    }

    if (
      item.status === "active" &&
      item.removal
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["removal"],
        message:
          "Active assumptions cannot contain removal metadata.",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

const persistedTimelineSchema = z
  .object({
    duration: z.string().optional(),
    startCondition: z.string().optional(),
    dependencies: z.array(z.string()),
    sourceReferences: z.array(
      sourceReferenceSchema,
    ),

    provenance: provenanceSchema.optional(),

    amendment: amendmentSchema.optional(),
  })
  .superRefine((timeline, context) => {
    const hasContent =
      Boolean(timeline.duration?.trim()) ||
      Boolean(
        timeline.startCondition?.trim(),
      ) ||
      timeline.dependencies.length > 0 ||
      timeline.sourceReferences.length > 0 ||
      Boolean(timeline.provenance) ||
      Boolean(timeline.amendment);

    // Empty timeline is a valid extraction state.
    if (!hasContent) {
      return;
    }

    if (!timeline.provenance) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provenance"],
        message:
          "Timeline content must declare provenance.",
      });

      return;
    }

    if (
      timeline.provenance.type ===
        "document_extraction" &&
      timeline.sourceReferences.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceReferences"],
        message:
          "Document-extracted timeline content must contain source evidence.",
      });
    }

    if (
      timeline.provenance.type ===
        "manual_amendment" &&
      timeline.sourceReferences.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceReferences"],
        message:
          "Manual timeline amendments cannot contain document source references.",
      });
    }

    if (
      timeline.provenance.type ===
        "manual_amendment" &&
      timeline.amendment
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amendment"],
        message:
          "Manual timeline amendments cannot also contain amendment metadata.",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/* Canonical persisted scope                                                   */
/* -------------------------------------------------------------------------- */

export const normalizedScopeSchema = z
  .object({
    deliverables: z.array(
      persistedScopeItemSchema,
    ),

    features: z.array(
      persistedScopeItemSchema,
    ),

    exclusions: z.array(
      persistedScopeItemSchema,
    ),

    clientResponsibilities: z.array(
      persistedScopeItemSchema,
    ),

    revisionLimits: z.array(
      persistedRevisionLimitSchema,
    ),

    timeline: persistedTimelineSchema,

    assumptions: z.array(
      persistedAssumptionSchema,
    ),
  })
  .superRefine((scope, context) => {
    // IDs identify logical scope items. One ID must never represent
    // two different items or two different scope categories.
    const seenIds = new Map<string, string>();

    const sections = [
      ["deliverables", scope.deliverables],
      ["features", scope.features],
      ["exclusions", scope.exclusions],
      [
        "clientResponsibilities",
        scope.clientResponsibilities,
      ],
      ["revisionLimits", scope.revisionLimits],
      ["assumptions", scope.assumptions],
    ] as const;

    for (const [section, items] of sections) {
      items.forEach((item, index) => {
        const previousSection =
          seenIds.get(item.id);

        if (previousSection) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [section, index, "id"],
            message:
              `Item ID "${item.id}" is already used in ${previousSection}.`,
          });

          return;
        }

        seenIds.set(item.id, section);
      });
    }
  });

export type NormalizedScope = z.infer<
  typeof normalizedScopeSchema
>;

/* -------------------------------------------------------------------------- */
/* Legacy persisted-data compatibility                                        */
/* -------------------------------------------------------------------------- */

function stableHash(
  value: string,
  seed: number,
): string {
  let hash = seed >>> 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, "0");
}

function createLegacyItemId(
  category: string,
  item: Record<string, unknown>,
): string {
  // Include category so identical evidence used in different old categories
  // does not accidentally create the same logical item ID.
  const fingerprint = JSON.stringify({
    category,
    title: item.title,
    description: item.description,
    statement: item.statement,
    type: item.type,
    limit: item.limit,
    sourceReferences: item.sourceReferences,
  });

  return `legacy_${stableHash(
    fingerprint,
    2166136261,
  )}_${stableHash(
    fingerprint,
    2246822519,
  )}`;
}

function normalizeLegacyItem(
  value: unknown,
  category: string,
): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return value;
  }

  const record = {
    ...(value as Record<string, unknown>),
  };

  const sourceReferences = Array.isArray(
    record.sourceReferences,
  )
    ? record.sourceReferences
    : [];

  // Old extracted items had source references but no provenance.
  if (
    !record.provenance &&
    sourceReferences.length > 0
  ) {
    record.provenance = {
      type: "document_extraction",
    };
  }

  // Old extracted items were active by definition because removals
  // did not exist in the previous contract.
  if (
    !record.status &&
    record.provenance
  ) {
    record.status = "active";
  }

  // Backfill a deterministic identity for old document-derived items.
  if (
    !record.id &&
    record.provenance &&
    typeof record.provenance === "object" &&
    (record.provenance as Record<string, unknown>)
      .type === "document_extraction"
  ) {
    record.id = createLegacyItemId(
      category,
      record,
    );
  }

  return record;
}

function normalizeLegacyTimeline(
  value: unknown,
): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return value;
  }

  const record = {
    ...(value as Record<string, unknown>),
  };

  const sourceReferences = Array.isArray(
    record.sourceReferences,
  )
    ? record.sourceReferences
    : [];

  if (
    !record.provenance &&
    sourceReferences.length > 0
  ) {
    record.provenance = {
      type: "document_extraction",
    };
  }

  return record;
}

/**
 * Converts old ScopeBaseline JSON into the current persisted contract.
 *
 * This is for legacy database records only.
 * New Gemini output does not pass through this path.
 */
export function normalizeLegacyScope(
  value: unknown,
): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return value;
  }

  const record = value as Record<string, unknown>;

  return {
    ...record,

    deliverables: Array.isArray(
      record.deliverables,
    )
      ? record.deliverables.map((item) =>
          normalizeLegacyItem(
            item,
            "deliverables",
          ),
        )
      : record.deliverables,

    features: Array.isArray(
      record.features,
    )
      ? record.features.map((item) =>
          normalizeLegacyItem(
            item,
            "features",
          ),
        )
      : record.features,

    exclusions: Array.isArray(
      record.exclusions,
    )
      ? record.exclusions.map((item) =>
          normalizeLegacyItem(
            item,
            "exclusions",
          ),
        )
      : record.exclusions,

    clientResponsibilities:
      Array.isArray(
        record.clientResponsibilities,
      )
        ? record.clientResponsibilities.map(
            (item) =>
              normalizeLegacyItem(
                item,
                "clientResponsibilities",
              ),
          )
        : record.clientResponsibilities,

    revisionLimits: Array.isArray(
      record.revisionLimits,
    )
      ? record.revisionLimits.map((item) =>
          normalizeLegacyItem(
            item,
            "revisionLimits",
          ),
        )
      : record.revisionLimits,

    timeline: normalizeLegacyTimeline(
      record.timeline,
    ),

    assumptions: Array.isArray(
      record.assumptions,
    )
      ? record.assumptions.map((item) =>
          normalizeLegacyItem(
            item,
            "assumptions",
          ),
        )
      : record.assumptions,
  };
}

export function parseStoredScope(
  value: unknown,
) {
  return normalizedScopeSchema.safeParse(
    normalizeLegacyScope(value),
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence validation                                                        */
/* -------------------------------------------------------------------------- */

export function validateExtractedScopeSourceReferences(
  scope: ExtractedScope,
  sourceText: string,
): boolean {
  const quotes: string[] = [];

  const validateReferences = (
    items: Array<{
      sourceReferences: Array<{
        quote: string;
      }>;
    }>,
  ) => {
    for (const item of items) {
      if (
        item.sourceReferences.length === 0
      ) {
        console.error(
          "Extracted item has no source references.",
        );

        return false;
      }

      for (const reference of item.sourceReferences) {
        if (
          !sourceText.includes(
            reference.quote,
          )
        ) {
          console.error(
            "Invalid source reference:",
            JSON.stringify(reference.quote),
          );

          return false;
        }

        quotes.push(reference.quote);
      }
    }

    return true;
  };

  if (
    !validateReferences(scope.deliverables)
  ) {
    return false;
  }

  if (
    !validateReferences(scope.features)
  ) {
    return false;
  }

  if (
    !validateReferences(scope.exclusions)
  ) {
    return false;
  }

  if (
    !validateReferences(
      scope.clientResponsibilities,
    )
  ) {
    return false;
  }

  if (
    !validateReferences(
      scope.revisionLimits,
    )
  ) {
    return false;
  }

  if (
    !validateReferences(scope.assumptions)
  ) {
    return false;
  }

  for (const reference of scope.timeline
    .sourceReferences) {
    if (
      !sourceText.includes(
        reference.quote,
      )
    ) {
      console.error(
        "Invalid timeline source reference:",
        JSON.stringify(reference.quote),
      );

      return false;
    }

    quotes.push(reference.quote);
  }

  if (new Set(quotes).size !== quotes.length) {
    const duplicates = quotes.filter(
      (quote, index) =>
        quotes.indexOf(quote) !== index,
    );

    console.error(
      "Duplicate source references:",
      [...new Set(duplicates)],
    );

    return false;
  }

  return true;
}

/**
 * Validate a persisted scope.
 *
 * Document-derived items must have real SOW evidence.
 * Manual amendments intentionally have none.
 */
export function validateScopeSourceReferences(
  scope: NormalizedScope,
  sourceText: string,
): boolean {
  const quotes: string[] = [];

  const validateReferences = (
    items: Array<{
      sourceReferences: Array<{
        quote: string;
      }>;
      provenance: {
        type:
          | "document_extraction"
          | "manual_amendment";
      };
    }>,
  ) => {
    for (const item of items) {
      if (
        item.provenance.type ===
        "manual_amendment"
      ) {
        if (
          item.sourceReferences.length > 0
        ) {
          console.error(
            "Manual amendment contains document source references.",
          );

          return false;
        }

        continue;
      }

      if (
        item.sourceReferences.length === 0
      ) {
        console.error(
          "Document-extracted item has no source references.",
        );

        return false;
      }

      for (const reference of item.sourceReferences) {
        if (
          !sourceText.includes(
            reference.quote,
          )
        ) {
          console.error(
            "Invalid source reference:",
            JSON.stringify(reference.quote),
          );

          return false;
        }

        quotes.push(reference.quote);
      }
    }

    return true;
  };

  if (
    !validateReferences(scope.deliverables)
  ) {
    return false;
  }

  if (!validateReferences(scope.features)) {
    return false;
  }

  if (!validateReferences(scope.exclusions)) {
    return false;
  }

  if (
    !validateReferences(
      scope.clientResponsibilities,
    )
  ) {
    return false;
  }

  if (
    !validateReferences(
      scope.revisionLimits,
    )
  ) {
    return false;
  }

  if (
    !validateReferences(scope.assumptions)
  ) {
    return false;
  }

  if (scope.timeline.provenance) {
    if (
      scope.timeline.provenance.type ===
      "manual_amendment"
    ) {
      if (
        scope.timeline.sourceReferences.length >
        0
      ) {
        console.error(
          "Manual timeline amendment contains document source references.",
        );

        return false;
      }
    } else {
      if (
        scope.timeline.sourceReferences.length ===
        0
      ) {
        console.error(
          "Document-extracted timeline has no source references.",
        );

        return false;
      }

      for (const reference of scope.timeline
        .sourceReferences) {
        if (
          !sourceText.includes(
            reference.quote,
          )
        ) {
          console.error(
            "Invalid timeline source reference:",
            JSON.stringify(reference.quote),
          );

          return false;
        }

        quotes.push(reference.quote);
      }
    }
  }

  if (new Set(quotes).size !== quotes.length) {
    const duplicates = quotes.filter(
      (quote, index) =>
        quotes.indexOf(quote) !== index,
    );

    console.error(
      "Duplicate source references:",
      [...new Set(duplicates)],
    );

    return false;
  }

  return true;
}