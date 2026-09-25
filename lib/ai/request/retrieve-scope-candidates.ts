import { geminiProvider } from "@/lib/ai/gemini";
import {
  parseStoredScope,
  type NormalizedScope,
} from "@/lib/scope-schema";

export const SCOPE_CANDIDATE_RETRIEVAL_VERSION =
  "semantic-retrieval-v1";

export type ScopeCandidateRetrievalResult = {
  scopeItemIds: string[];
};

type StandardScopeSection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities";

type StandardScopeItem =
  NormalizedScope["deliverables"][number];

type RevisionLimitScopeItem =
  NormalizedScope["revisionLimits"][number];

type AssumptionScopeItem =
  NormalizedScope["assumptions"][number];

export type ScopeCandidateEvidence = {
  id: string;
  section:
    | "deliverables"
    | "features"
    | "exclusions"
    | "clientResponsibilities"
    | "revisionLimits"
    | "assumptions";

  title?: string;
  description?: string;

  type?: string;
  limit?: string;

  statement?: string;

  sourceReferences: Array<{
    quote: string;
    section?: string;
  }>;

  provenance:
    | StandardScopeItem["provenance"]
    | RevisionLimitScopeItem["provenance"]
    | AssumptionScopeItem["provenance"];

  status: "active" | "removed";
};

const scopeCandidateRetrievalSchema = {
  type: "object",
  properties: {
    scopeItemIds: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["scopeItemIds"],
} as const;

const SYSTEM_INSTRUCTION = `
You are the Scope Copilot Semantic Candidate Retrieval Engine.

Your job is ONLY to identify which existing scope items from the supplied
approved scope are potentially relevant to one atomic client request.

You are a semantic retrieval engine, NOT a scope classifier or decision engine.

Do NOT:
- decide whether the request is in scope
- decide whether it is out of scope
- classify the request
- estimate effort
- estimate cost
- recommend pricing
- recommend an action
- write a client response
- invent scope items
- modify scope items
- create IDs
- explain your reasoning in the output

Your only output is the IDs of existing scope items that should be examined
by a later scope-comparison engine.

IMPORTANT RETRIEVAL PRINCIPLE:

Optimize for RECALL, not precision.

It is acceptable to return a scope item that later turns out to be irrelevant.
It is NOT acceptable to omit a scope item merely because the client used
different vocabulary from the approved scope.

Look for semantic relationships, including:
- equivalent concepts expressed using different terminology
- implementation terminology versus user-facing terminology
- broader/narrower concepts
- related functionality
- dependencies
- potentially conflicting scope
- explicit exclusions that may affect the request
- client responsibilities that may affect the request
- assumptions that may affect interpretation
- revision limits that may be relevant

Example:

Client request:
"Can users log in with their Google accounts?"

Approved scope item:
"OAuth2.0 Third-Party Authentication via Firebase."

That scope item MUST be considered a semantic candidate even though the
wording is different.

Another example:

Client request:
"Can we add Stripe checkout?"

A scope item mentioning "payment processing", "online payments", or
"e-commerce checkout" may be relevant even if it does not contain the word
"Stripe".

Return ONLY IDs that actually exist in the supplied scope.

Do not invent IDs.

If no scope item appears potentially relevant, return an empty array.

The complete approved scope is supplied to you because small agency scopes
are intentionally compact. Do not assume that only the features section
matters. Examine all independently identifiable scope sections.
`;

function normalizeCandidateIds(
  value: unknown,
): string[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Semantic scope retrieval returned an invalid result.",
    );
  }

  const scopeItemIds = (
    value as {
      scopeItemIds?: unknown;
    }
  ).scopeItemIds;

  if (!Array.isArray(scopeItemIds)) {
    throw new Error(
      "Semantic scope retrieval did not return scope item IDs.",
    );
  }

  const normalized = scopeItemIds.map(
    (id) => {
      if (typeof id !== "string") {
        throw new Error(
          "Semantic scope retrieval contains a non-text scope item ID.",
        );
      }

      const normalizedId = id.trim();

      if (!normalizedId) {
        throw new Error(
          "Semantic scope retrieval contains an empty scope item ID.",
        );
      }

      return normalizedId;
    },
  );

  const unique = new Set(normalized);

  if (unique.size !== normalized.length) {
    throw new Error(
      "Semantic scope retrieval contains duplicate scope item IDs.",
    );
  }

  return normalized;
}

export async function retrieveScopeCandidateIds(
  input: {
    clientRequestText: string;
    approvedScope: unknown;
  },
): Promise<ScopeCandidateRetrievalResult> {
  const clientRequestText =
    input.clientRequestText.trim();

  if (!clientRequestText) {
    throw new Error(
      "Client request cannot be empty.",
    );
  }

  const parsedScope =
    parseStoredScope(input.approvedScope);

  if (!parsedScope.success) {
    throw new Error(
      "Approved scope structure is invalid.",
    );
  }

  const result =
    await geminiProvider.generateStructuredOutput<unknown>(
      {
        systemInstruction:
          SYSTEM_INSTRUCTION,

        userContent: [
          "Atomic client request:",
          "",
          clientRequestText,
          "",
          "Complete approved scope:",
          "",
          JSON.stringify(
            parsedScope.data,
            null,
            2,
          ),
        ].join("\n"),

        schema:
          scopeCandidateRetrievalSchema,
      },
    );

  return {
    scopeItemIds:
      normalizeCandidateIds(result),
  };
}

/**
 * Resolve standard scope items into canonical evidence.
 *
 * The AI only returns IDs. This function is the deterministic bridge that
 * resolves those IDs against the exact approved scope supplied by the caller.
 */
function resolveStandardItems(
  section: StandardScopeSection,
  items: StandardScopeItem[],
  candidateIds: Set<string>,
  candidatesById: Map<
    string,
    ScopeCandidateEvidence
  >,
) {
  for (const item of items) {
    if (candidatesById.has(item.id)) {
      throw new Error(
        `Approved scope contains duplicate scope item ID "${item.id}".`,
      );
    }

    if (!candidateIds.has(item.id)) {
      continue;
    }

    candidatesById.set(item.id, {
      id: item.id,
      section,
      title: item.title,
      description: item.description,
      sourceReferences:
        item.sourceReferences,
      provenance: item.provenance,
      status: item.status,
    });
  }
}

/**
 * Resolve semantic candidate IDs against the canonical approved scope.
 *
 * This function never trusts the model's IDs blindly:
 * - every returned ID must exist
 * - every returned item comes from the supplied approved scope
 * - canonical evidence is taken from the approved scope itself
 * - no AI-generated wording becomes evidence
 */
export function resolveScopeCandidateIds(
  approvedScope: NormalizedScope,
  candidateIds: string[],
): ScopeCandidateEvidence[] {
  const candidatesById =
    new Map<string, ScopeCandidateEvidence>();

  const candidateIdSet =
    new Set(candidateIds);

  /*
   * Standard scope sections.
   *
   * These all share the same persisted item shape:
   * title + optional description + evidence + lifecycle metadata.
   */
  resolveStandardItems(
    "deliverables",
    approvedScope.deliverables,
    candidateIdSet,
    candidatesById,
  );

  resolveStandardItems(
    "features",
    approvedScope.features,
    candidateIdSet,
    candidatesById,
  );

  resolveStandardItems(
    "exclusions",
    approvedScope.exclusions,
    candidateIdSet,
    candidatesById,
  );

  resolveStandardItems(
    "clientResponsibilities",
    approvedScope.clientResponsibilities,
    candidateIdSet,
    candidatesById,
  );

  /*
   * Revision limits have a different canonical shape:
   * type + limit.
   */
  for (const item of approvedScope.revisionLimits) {
    if (candidatesById.has(item.id)) {
      throw new Error(
        `Approved scope contains duplicate scope item ID "${item.id}".`,
      );
    }

    if (!candidateIdSet.has(item.id)) {
      continue;
    }

    candidatesById.set(item.id, {
      id: item.id,
      section: "revisionLimits",
      type: item.type,
      limit: item.limit,
      sourceReferences:
        item.sourceReferences,
      provenance: item.provenance,
      status: item.status,
    });
  }

  /*
   * Assumptions have another distinct canonical shape:
   * statement.
   */
  for (const item of approvedScope.assumptions) {
    if (candidatesById.has(item.id)) {
      throw new Error(
        `Approved scope contains duplicate scope item ID "${item.id}".`,
      );
    }

    if (!candidateIdSet.has(item.id)) {
      continue;
    }

    candidatesById.set(item.id, {
      id: item.id,
      section: "assumptions",
      statement: item.statement,
      sourceReferences:
        item.sourceReferences,
      provenance: item.provenance,
      status: item.status,
    });
  }

  /*
   * Every model-returned ID must resolve.
   *
   * This is the critical deterministic safety boundary between AI retrieval
   * and canonical application data.
   */
  const resolved: ScopeCandidateEvidence[] =
    [];

  for (const candidateId of candidateIds) {
    const candidate =
      candidatesById.get(candidateId);

    if (!candidate) {
      throw new Error(
        `Semantic scope retrieval returned unknown scope item ID "${candidateId}".`,
      );
    }

    resolved.push(candidate);
  }

  return resolved;
}