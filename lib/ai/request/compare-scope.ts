import { geminiProvider } from "@/lib/ai/gemini";
import type { ScopeCandidateEvidence } from "@/lib/ai/request/retrieve-scope-candidates";

export const SCOPE_COMPARISON_VERSION =
  "scope-comparison-v2";

export const SCOPE_RELATIONSHIPS = [
  "DIRECTLY_INCLUDED",
  "PARTIALLY_INCLUDED",
  "RELATED_NOT_INCLUDED",
  "EXPLICITLY_EXCLUDED",
  "CONFLICTING",
  "AMBIGUOUS",
  "UNRELATED",
  "NO_SCOPE_EVIDENCE",
] as const;

export type ScopeRelationship =
  (typeof SCOPE_RELATIONSHIPS)[number];

export const SCOPE_COMPARISON_CONFIDENCE = [
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;

export type ScopeComparisonConfidence =
  (typeof SCOPE_COMPARISON_CONFIDENCE)[number];

export type ScopeComparison = {
  scopeItemId: string;
  relationship: ScopeRelationship;
  explanation: string;
};

export type ScopeComparisonResult = {
  overallRelationship: ScopeRelationship;
  comparisons: ScopeComparison[];
  confidence?: ScopeComparisonConfidence;
};

const scopeComparisonSchema = {
  type: "object",
  properties: {
    overallRelationship: {
      type: "string",
      enum: [
        "DIRECTLY_INCLUDED",
        "PARTIALLY_INCLUDED",
        "RELATED_NOT_INCLUDED",
        "EXPLICITLY_EXCLUDED",
        "CONFLICTING",
        "AMBIGUOUS",
        "UNRELATED",
        "NO_SCOPE_EVIDENCE",
      ],
    },

    comparisons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scopeItemId: {
            type: "string",
          },

          relationship: {
            type: "string",
            enum: [
              "DIRECTLY_INCLUDED",
              "PARTIALLY_INCLUDED",
              "RELATED_NOT_INCLUDED",
              "EXPLICITLY_EXCLUDED",
              "CONFLICTING",
              "AMBIGUOUS",
              "UNRELATED",
              "NO_SCOPE_EVIDENCE",
            ],
          },

          explanation: {
            type: "string",
          },
        },

        required: [
          "scopeItemId",
          "relationship",
          "explanation",
        ],
      },
    },

    confidence: {
      type: "string",
      enum: [
        "HIGH",
        "MEDIUM",
        "LOW",
      ],
    },
  },

  required: [
    "overallRelationship",
    "comparisons",
  ],
} as const;

const SYSTEM_INSTRUCTION = `
You are the Scope Copilot Deep Scope Comparison Engine.

Your job is ONLY to determine the semantic relationship between one atomic
client request and the supplied candidate items from the approved scope.

The approved scope candidates have already been retrieved by a separate
semantic retrieval engine.

You are NOT a pricing engine, effort estimator, recommendation engine, or
client communication engine.

DO NOT:
- estimate effort
- estimate cost
- estimate timeline
- recommend whether the agency should accept the request
- recommend pricing
- decide whether work should be absorbed
- decide whether work should be charged
- write a client response
- invent scope items
- invent scope item IDs
- modify approved scope
- treat the absence of a candidate as proof of out-of-scope work

Your job is to interpret the semantic relationship between the client request
and each supplied candidate scope item.

IMPORTANT DISTINCTION:

Candidate retrieval intentionally favors recall.

Therefore, a retrieved candidate may:
- directly support the requested capability
- support only part of the requested capability
- be related contextual scope but not actually cover the requested capability
- be an exclusion relevant to the request
- conflict with the request
- be ambiguous
- be an unrelated retrieval false positive

Do NOT treat shared nouns, pages, entities, product areas, or context as
evidence that the requested functionality itself is included.

The approved scope is the source of truth.

RELATIONSHIPS:

DIRECTLY_INCLUDED

Use when the requested capability is explicitly covered by the candidate scope
item with substantially the same intended functionality or outcome.

Example:

Client request:
"Can users log in with Google?"

Scope:
"OAuth2.0 third-party authentication via Firebase."

This can be DIRECTLY_INCLUDED.

PARTIALLY_INCLUDED

Use ONLY when the client request contains multiple meaningful requested
components and the approved scope explicitly supports at least one meaningful
component of the requested functionality while other meaningful requested
components are not supported by the supplied scope evidence.

PARTIALLY_INCLUDED requires actual scope evidence for a requested capability.

Do NOT use PARTIALLY_INCLUDED merely because:
- the same page is mentioned
- the same product area is mentioned
- the candidate is contextually related
- a broader concept exists in scope
- the candidate could be a place where the requested feature might be implemented

Example:

Scope:
"About page."

Client request:
"Replace the About Us text and add a scroll-animated timeline."

The About page supports one requested component, while the timeline animation
is not supported.

This can be PARTIALLY_INCLUDED.

Counterexample:

Scope:
"Responsive homepage."

Client request:
"Add an Instagram feed to the homepage."

The homepage being in scope does NOT establish that an Instagram feed,
social-media integration, external API integration, embedded feed, or similar
functionality is included.

This should generally be RELATED_NOT_INCLUDED unless another supplied scope
candidate explicitly supports the Instagram/social-feed capability.

RELATED_NOT_INCLUDED

Use when a supplied scope item is clearly related to the request or provides
context for it, but the candidate does not itself cover the requested
capability.

Example:

Scope:
"Responsive homepage."

Client request:
"Add an Instagram feed to the homepage."

The homepage is relevant context, but the approved evidence does not establish
that the Instagram feed functionality is included.

This should be RELATED_NOT_INCLUDED.

Another example:

Scope:
"User authentication."

Client request:
"Add social sharing to user profiles."

The concepts may exist in the same product area, but the requested capability
is not covered by that scope item.

EXPLICITLY_EXCLUDED

Use when the candidate is an approved exclusion that explicitly excludes the
requested capability.

Example:

Scope exclusion:
"Additional third-party integrations are excluded."

Client request:
"Add a new third-party CRM integration."

CONFLICTING

Use when the client request directly conflicts with an approved scope
constraint, requirement, or responsibility.

This is stronger than merely being absent from scope.

AMBIGUOUS

Use when the available approved scope evidence is genuinely insufficient to
determine the relationship with reasonable confidence.

Do not invent an interpretation to eliminate ambiguity.

UNRELATED

Use when a retrieved candidate was a high-recall retrieval false positive and
has no meaningful semantic relationship to the client request.

NO_SCOPE_EVIDENCE

This relationship is reserved for the application-level condition where no
approved scope candidates were retrieved.

When candidate retrieval returns zero candidates, the comparison engine does
NOT perform an AI comparison.

In that case the application returns:

- overallRelationship: NO_SCOPE_EVIDENCE
- comparisons: []
- no confidence value

NO_SCOPE_EVIDENCE means:

"No matching approved-scope evidence was retrieved."

It does NOT mean:

"The request is definitely out of scope."

Do not use NO_SCOPE_EVIDENCE for an individual supplied candidate.

IMPORTANT:

For supplied candidates, evaluate each candidate independently.

The overall relationship should represent the strongest meaningful relationship
between the request and the supplied candidates.

Do not treat a single weak or incidental relationship as stronger than clear
approved scope evidence.

For PARTIALLY_INCLUDED specifically:

A shared page, entity, product area, or contextual relationship is NOT enough.

The candidate must explicitly support at least one meaningful requested
capability.

The client request is the thing being interpreted.

The approved scope is the source of truth.

Never invent evidence.

Never rewrite or fabricate approved scope wording.

Return only structured JSON matching the supplied schema.
`;

function normalizeComparisonResult(
  value: unknown,
  candidateIds: Set<string>,
): ScopeComparisonResult {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Scope comparison returned an invalid result.",
    );
  }

  const result =
    value as {
      overallRelationship?: unknown;
      comparisons?: unknown;
      confidence?: unknown;
    };

  if (
    typeof result.overallRelationship !==
      "string" ||
    !SCOPE_RELATIONSHIPS.includes(
      result.overallRelationship as ScopeRelationship,
    )
  ) {
    throw new Error(
      "Scope comparison returned an invalid overall relationship.",
    );
  }

  if (!Array.isArray(result.comparisons)) {
    throw new Error(
      "Scope comparison did not return comparisons.",
    );
  }

  const overallRelationship =
    result.overallRelationship as ScopeRelationship;

  if (
    overallRelationship ===
    "NO_SCOPE_EVIDENCE"
  ) {
    throw new Error(
      "NO_SCOPE_EVIDENCE is only valid when no scope candidates were supplied.",
    );
  }

  if (
    typeof result.confidence !== "string" ||
    !SCOPE_COMPARISON_CONFIDENCE.includes(
      result.confidence as ScopeComparisonConfidence,
    )
  ) {
    throw new Error(
      "Scope comparison returned an invalid confidence value.",
    );
  }

  const comparisons: ScopeComparison[] =
    [];

  const seenIds = new Set<string>();

  for (const comparison of result.comparisons) {
    if (
      !comparison ||
      typeof comparison !== "object" ||
      Array.isArray(comparison)
    ) {
      throw new Error(
        "Scope comparison contains an invalid comparison item.",
      );
    }

    const item =
      comparison as {
        scopeItemId?: unknown;
        relationship?: unknown;
        explanation?: unknown;
      };

    if (
      typeof item.scopeItemId !== "string" ||
      !item.scopeItemId.trim()
    ) {
      throw new Error(
        "Scope comparison contains an invalid scope item ID.",
      );
    }

    const scopeItemId =
      item.scopeItemId.trim();

    if (!candidateIds.has(scopeItemId)) {
      throw new Error(
        `Scope comparison referenced scope item ID "${scopeItemId}" that was not supplied as a candidate.`,
      );
    }

    if (seenIds.has(scopeItemId)) {
      throw new Error(
        `Scope comparison contains duplicate scope item ID "${scopeItemId}".`,
      );
    }

    seenIds.add(scopeItemId);

    if (
      typeof item.relationship !== "string" ||
      !SCOPE_RELATIONSHIPS.includes(
        item.relationship as ScopeRelationship,
      )
    ) {
      throw new Error(
        `Scope comparison returned an invalid relationship for scope item "${scopeItemId}".`,
      );
    }

    if (
      item.relationship ===
      "NO_SCOPE_EVIDENCE"
    ) {
      throw new Error(
        `Scope comparison returned NO_SCOPE_EVIDENCE for supplied scope item "${scopeItemId}".`,
      );
    }

    if (
      typeof item.explanation !== "string" ||
      !item.explanation.trim()
    ) {
      throw new Error(
        `Scope comparison returned an empty explanation for scope item "${scopeItemId}".`,
      );
    }

    comparisons.push({
      scopeItemId,
      relationship:
        item.relationship as ScopeRelationship,
      explanation:
        item.explanation.trim(),
    });
  }

  if (
    comparisons.length !== candidateIds.size
  ) {
    throw new Error(
      "Scope comparison must evaluate every supplied candidate scope item exactly once.",
    );
  }

  return {
    overallRelationship,
    comparisons,
    confidence:
      result.confidence as ScopeComparisonConfidence,
  };
}

export async function compareRequestToScope(
  input: {
    clientRequestText: string;
    candidates: ScopeCandidateEvidence[];
    traceId?: string;
  },
): Promise<ScopeComparisonResult> {
  const clientRequestText =
    input.clientRequestText.trim();

  if (!clientRequestText) {
    throw new Error(
      "Client request cannot be empty.",
    );
  }

  const candidateIds =
    new Set(
      input.candidates.map(
        (candidate) => candidate.id,
      ),
    );

  if (
    candidateIds.size !==
    input.candidates.length
  ) {
    throw new Error(
      "Scope comparison candidates contain duplicate IDs.",
    );
  }

  if (input.candidates.length === 0) {
    return {
      overallRelationship:
        "NO_SCOPE_EVIDENCE",
      comparisons: [],
    };
  }

  const result =
    await geminiProvider.generateStructuredOutput<unknown>(
      {
        operation: "scope-comparison",
        traceId: input.traceId,

        systemInstruction:
          SYSTEM_INSTRUCTION,

        userContent: [
          "Atomic client request:",
          "",
          clientRequestText,
          "",
          "Validated approved-scope candidates:",
          "",
          JSON.stringify(
            input.candidates,
            null,
            2,
          ),
        ].join("\n"),

        schema:
          scopeComparisonSchema,
      },
    );

  return normalizeComparisonResult(
    result,
    candidateIds,
  );
}