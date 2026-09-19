import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import {
  extractedScopeSchema,
  parseStoredScope,
  validateScopeSourceReferences,
  type ExtractedScope,
  type NormalizedScope,
} from "@/lib/scope-schema";
import {
  diffScopes,
  type ScopeDiff,
} from "@/lib/scope-diff";
import {
  reconcileScopeIdentities,
  type ReconciliationUnresolvedEntry,
  type ScopeIdentityReconciliation,
} from "@/lib/scope-reconciliation";
import {
  getManualCarryOverRequests,
  type ManualCarryOverRequest,
} from "@/lib/scope-carryover";

export type ScopeRevisionReview = {
  candidate: {
    id: string;
    projectId: string;
    baseBaselineId: string;
    status: string;
    sourceType: string;
    sourceText: string;
    createdAt: string;
    updatedAt: string;
  };

  baseBaseline: {
    id: string;
    version: number;
    status: string;
    sourceText: string;
  };

  baseScope: NormalizedScope;
  candidateScope: ExtractedScope;
  diff: ScopeDiff;
  reconciliation: ScopeIdentityReconciliation;
  carryOverRequests: ManualCarryOverRequest[];
  unresolved: ReconciliationUnresolvedEntry[];
};

/**
 * Build the complete review read-model from one pending revision candidate.
 *
 * Everything is resolved through the authenticated organization so the
 * browser cannot inspect another tenant's SOW revision.
 */
export async function getScopeRevisionReview(
  candidateId: string,
): Promise<ScopeRevisionReview> {
  const organizationId =
    await getCurrentOrganizationId();

  const candidate =
    await prisma.scopeRevisionCandidate.findFirst({
      where: {
        id: candidateId,
        project: {
          organizationId,
        },
      },
      select: {
        id: true,
        projectId: true,
        baseBaselineId: true,
        status: true,
        sourceType: true,
        sourceText: true,
        extractedScope: true,
        createdAt: true,
        updatedAt: true,
        baseBaseline: {
          select: {
            id: true,
            version: true,
            status: true,
            sourceText: true,
            structuredScope: true,
          },
        },
      },
    });

  if (!candidate) {
    throw new Error(
      "Scope revision candidate not found.",
    );
  }

  if (candidate.status !== "PENDING_REVIEW") {
    throw new Error(
      "Only pending scope revisions can be reviewed.",
    );
  }

  if (
    candidate.baseBaseline.status !==
    "APPROVED"
  ) {
    throw new Error(
      "The revision must be based on an approved scope baseline.",
    );
  }

  const parsedBase =
    parseStoredScope(
      candidate.baseBaseline.structuredScope,
    );

  if (!parsedBase.success) {
    throw new Error(
      "The approved scope baseline is invalid.",
    );
  }

  const baseScope = parsedBase.data;

  if (
    !validateScopeSourceReferences(
      baseScope,
      candidate.baseBaseline.sourceText,
    )
  ) {
    throw new Error(
      "The approved scope baseline contains invalid source references.",
    );
  }

  const parsedCandidate =
    extractedScopeSchema.safeParse(
      candidate.extractedScope,
    );

  if (!parsedCandidate.success) {
    throw new Error(
      "The scope revision candidate is invalid.",
    );
  }

  const candidateScope =
    parsedCandidate.data;

  if (
    !validateExtractedScopeSourceReferencesForReview(
      candidateScope,
      candidate.sourceText,
    )
  ) {
    throw new Error(
      "The scope revision candidate contains invalid source references.",
    );
  }

  const diff = diffScopes(
    baseScope,
    candidateScope,
  );

  // Added-item IDs are only needed for the reconciliation view.
  // They are intentionally not persisted here.
  let generatedId = 0;

  const reconciliation =
    reconcileScopeIdentities(
      baseScope,
      candidateScope,
      diff,
      () => {
        generatedId += 1;
        return `review-added-${generatedId}`;
      },
    );

  const carryOverRequests =
    getManualCarryOverRequests(
      reconciliation,
    );

  return {
    candidate: {
      id: candidate.id,
      projectId: candidate.projectId,
      baseBaselineId:
        candidate.baseBaselineId,
      status: candidate.status,
      sourceType: candidate.sourceType,
      sourceText: candidate.sourceText,
      createdAt:
        candidate.createdAt.toISOString(),
      updatedAt:
        candidate.updatedAt.toISOString(),
    },

    baseBaseline: {
      id: candidate.baseBaseline.id,
      version:
        candidate.baseBaseline.version,
      status:
        candidate.baseBaseline.status,
      sourceText:
        candidate.baseBaseline.sourceText,
    },

    baseScope,
    candidateScope,
    diff,
    reconciliation,
    carryOverRequests,
    unresolved:
      reconciliation.unresolved,
  };
}

/**
 * The extraction pipeline already validates this before persistence.
 * We repeat the check at the review boundary because the candidate is
 * stored as JSON and must never be trusted blindly.
 */
function validateExtractedScopeSourceReferencesForReview(
  scope: ExtractedScope,
  sourceText: string,
): boolean {
  const validateItems = (
    items: Array<{
      sourceReferences: Array<{
        quote: string;
      }>;
    }>,
  ) => {
    for (const item of items) {
      if (item.sourceReferences.length === 0) {
        return false;
      }

      for (const reference of item.sourceReferences) {
        if (
          !sourceText.includes(
            reference.quote,
          )
        ) {
          return false;
        }
      }
    }

    return true;
  };

  if (
    !validateItems(
      scope.deliverables,
    )
  ) {
    return false;
  }

  if (
    !validateItems(scope.features)
  ) {
    return false;
  }

  if (
    !validateItems(scope.exclusions)
  ) {
    return false;
  }

  if (
    !validateItems(
      scope.clientResponsibilities,
    )
  ) {
    return false;
  }

  if (
    !validateItems(
      scope.revisionLimits,
    )
  ) {
    return false;
  }

  if (
    !validateItems(scope.assumptions)
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
      return false;
    }
  }

  return true;
}