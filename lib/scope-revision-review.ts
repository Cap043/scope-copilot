import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import { getCurrentSession } from "@/lib/organization-access";

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

import {
  buildCurrentRevisionDecisions,
  type RevisionReviewDecision,
  type RevisionReviewDecisionRecord,
} from "@/lib/scope-revision-review-state";

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

  /**
   * Durable reviewer state.
   *
   * decisions = latest decision for each scope item.
   * history   = complete append-only decision history.
   */
  review: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    decisions: Record<
      string,
      RevisionReviewDecision
    >;
    history: RevisionReviewDecisionRecord[];
  };

  baseScope: NormalizedScope;
  candidateScope: ExtractedScope;
  diff: ScopeDiff;
  reconciliation: ScopeIdentityReconciliation;
  carryOverRequests: ManualCarryOverRequest[];
  unresolved: ReconciliationUnresolvedEntry[];
};

export type RevisionReviewSaveResult = {
  id: string;
  itemId: string;
  section: string;
  decision: RevisionReviewDecision;
  actorId: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
};

/**
 * Ensure that every pending revision candidate has exactly one durable
 * review workspace.
 *
 * This is an upsert so candidates created before 9G remain compatible with
 * the new persistent review system.
 */
async function ensureRevisionReview(
  candidateId: string,
) {
  return prisma.revisionReview.upsert({
    where: {
      candidateId,
    },

    update: {},

    create: {
      candidateId,
      status: "IN_PROGRESS",
    },

    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      decisions: {
        orderBy: [
          {
            createdAt: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          itemId: true,
          section: true,
          decision: true,
          actorId: true,
          createdAt: true,

          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Build the complete diff/reconciliation view from trusted persisted scope
 * data.
 *
 * Added-item IDs only exist temporarily for rendering the review.
 * They are never stored as review state.
 */
function buildRevisionArtifacts(
  baseScope: NormalizedScope,
  candidateScope: ExtractedScope,
) {
  const diff = diffScopes(
    baseScope,
    candidateScope,
  );

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

  return {
    diff,
    reconciliation,
    carryOverRequests:
      getManualCarryOverRequests(
        reconciliation,
      ),
  };
}

/**
 * Load the complete reconciliation review for one pending revision.
 *
 * The candidate, base scope, review, and decision history are all resolved
 * through the current organization before being returned to the browser.
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

  if (
    candidate.status !==
    "PENDING_REVIEW"
  ) {
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

  // Parse and validate the authoritative approved baseline.
  const parsedBase =
    parseStoredScope(
      candidate.baseBaseline.structuredScope,
    );

  if (!parsedBase.success) {
    throw new Error(
      "The approved scope baseline is invalid.",
    );
  }

  const baseScope =
    parsedBase.data;

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

  // Parse and validate the newly extracted candidate.
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

  const artifacts =
    buildRevisionArtifacts(
      baseScope,
      candidateScope,
    );

  // Create/load the durable review workspace.
  const review =
    await ensureRevisionReview(
      candidate.id,
    );

  const history: RevisionReviewDecisionRecord[] =
    review.decisions.map(
      (record) => ({
        id: record.id,
        itemId: record.itemId,
        section: record.section,

        decision:
          record.decision as RevisionReviewDecision,

        actorId:
          record.actorId,

        actorName:
          record.actor.name,

        actorEmail:
          record.actor.email,

        createdAt:
          record.createdAt.toISOString(),
      }),
    );

  return {
    candidate: {
      id: candidate.id,
      projectId: candidate.projectId,
      baseBaselineId:
        candidate.baseBaselineId,
      status: candidate.status,
      sourceType:
        candidate.sourceType,
      sourceText:
        candidate.sourceText,

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

    review: {
      id: review.id,
      status: review.status,

      createdAt:
        review.createdAt.toISOString(),

      updatedAt:
        review.updatedAt.toISOString(),

      // Latest decision per item.
      decisions:
        buildCurrentRevisionDecisions(
          history,
        ),

      // Complete immutable decision history.
      history,
    },

    baseScope,
    candidateScope,

    diff:
      artifacts.diff,

    reconciliation:
      artifacts.reconciliation,

    carryOverRequests:
      artifacts.carryOverRequests,

    unresolved:
      artifacts.reconciliation.unresolved,
  };
}

/**
 * Persist one explicit reviewer decision.
 *
 * Decisions are append-only.
 *
 * Example:
 *
 * CARRY_OVER
 *      ↓
 * REMOVE
 *
 * produces two database rows instead of modifying the first row.
 *
 * The latest decision becomes authoritative while the earlier decision
 * remains available for audit/history.
 */
export async function saveScopeRevisionDecision(
  data: {
    candidateId: string;
    itemId: string;
    decision: RevisionReviewDecision;
  },
): Promise<RevisionReviewSaveResult> {
  const organizationId =
    await getCurrentOrganizationId();

  const session =
    await getCurrentSession();

  if (!session) {
    throw new Error(
      "Unauthorized",
    );
  }

  const candidate =
    await prisma.scopeRevisionCandidate.findFirst({
      where: {
        id: data.candidateId,

        project: {
          organizationId,
        },
      },

      select: {
        id: true,
        projectId: true,
        status: true,
        sourceText: true,
        extractedScope: true,

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

  if (
    candidate.status !==
    "PENDING_REVIEW"
  ) {
    throw new Error(
      "Only pending scope revisions can be edited.",
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

  // Re-validate the approved baseline before accepting a reviewer decision.
  const parsedBase =
    parseStoredScope(
      candidate.baseBaseline.structuredScope,
    );

  if (!parsedBase.success) {
    throw new Error(
      "The approved scope baseline is invalid.",
    );
  }

  if (
    !validateScopeSourceReferences(
      parsedBase.data,
      candidate.baseBaseline.sourceText,
    )
  ) {
    throw new Error(
      "The approved scope baseline contains invalid source references.",
    );
  }

  // Re-validate the candidate because it lives in JSON storage.
  const parsedCandidate =
    extractedScopeSchema.safeParse(
      candidate.extractedScope,
    );

  if (!parsedCandidate.success) {
    throw new Error(
      "The scope revision candidate is invalid.",
    );
  }

  if (
    !validateExtractedScopeSourceReferencesForReview(
      parsedCandidate.data,
      candidate.sourceText,
    )
  ) {
    throw new Error(
      "The scope revision candidate contains invalid source references.",
    );
  }

  // Recompute the actual reconciliation on the server.
  //
  // We do not trust the browser to tell us which items are eligible for a
  // human carry-over/remove decision.
  const artifacts =
    buildRevisionArtifacts(
      parsedBase.data,
      parsedCandidate.data,
    );

  const carryOverRequest =
    artifacts.carryOverRequests.find(
      (request) =>
        request.itemId ===
        data.itemId,
    );

  if (!carryOverRequest) {
    throw new Error(
      "A review decision is only valid for a missing manual scope amendment.",
    );
  }

  /**
   * A decision is only valid while this revision still targets the same
   * approved baseline that was current when the candidate was created.
   *
   * This prevents a reviewer from writing decisions into a stale review.
   */
  const latestApproved =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId:
          candidate.projectId,

        status:
          "APPROVED",
      },

      orderBy: {
        version: "desc",
      },

      select: {
        id: true,
      },
    });

  if (
    !latestApproved ||
    latestApproved.id !==
      candidate.baseBaseline.id
  ) {
    throw new Error(
      "This revision is stale. The project has a newer approved scope version.",
    );
  }

  /**
   * There must also be no newer DRAFT or other scope version.
   *
   * A review should never continue against a project that has already moved
   * beyond its base version.
   */
  const latestBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId:
          candidate.projectId,
      },

      orderBy: {
        version: "desc",
      },

      select: {
        id: true,
      },
    });

  if (
    !latestBaseline ||
    latestBaseline.id !==
      candidate.baseBaseline.id
  ) {
    throw new Error(
      "A newer scope version already exists for this project.",
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // A single candidate owns exactly one durable review workspace.
      const review =
        await tx.revisionReview.upsert({
          where: {
            candidateId:
              candidate.id,
          },

          update: {},

          create: {
            candidateId:
              candidate.id,

            status:
              "IN_PROGRESS",
          },

          select: {
            id: true,
            status: true,
          },
        });

      if (
        review.status !==
        "IN_PROGRESS"
      ) {
        throw new Error(
          "This revision review is no longer accepting decisions.",
        );
      }

      /**
       * If the reviewer clicks the same decision repeatedly, do not create
       * pointless duplicate audit rows.
       *
       * A real change still produces a new append-only record.
       */
      const latestDecision =
        await tx.revisionReviewDecision.findFirst({
          where: {
            reviewId:
              review.id,

            itemId:
              data.itemId,
          },

          orderBy: [
            {
              createdAt:
                "desc",
            },
            {
              id:
                "desc",
            },
          ],

          select: {
            id: true,
            itemId: true,
            section: true,
            decision: true,
            actorId: true,
            createdAt: true,

            actor: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

      if (
        latestDecision &&
        latestDecision.decision ===
          data.decision
      ) {
        return {
          id:
            latestDecision.id,

          itemId:
            latestDecision.itemId,

          section:
            latestDecision.section,

          decision:
            latestDecision.decision as RevisionReviewDecision,

          actorId:
            latestDecision.actorId,

          actorName:
            latestDecision.actor.name,

          actorEmail:
            latestDecision.actor.email,

          createdAt:
            latestDecision.createdAt.toISOString(),
        };
      }

      const decision =
        await tx.revisionReviewDecision.create({
          data: {
            reviewId:
              review.id,

            itemId:
              data.itemId,

            section:
              carryOverRequest.section,

            decision:
              data.decision,

            actorId:
              session.user.id,
          },

          select: {
            id: true,
            itemId: true,
            section: true,
            decision: true,
            actorId: true,
            createdAt: true,

            actor: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

      /**
       * Touch the parent review so updatedAt reflects the latest review
       * activity.
       *
       * No status transition happens here because the review remains
       * actively editable until finalization.
       */
      await tx.revisionReview.update({
        where: {
          id: review.id,
        },

        data: {
          status:
            "IN_PROGRESS",
        },
      });

      return {
        id:
          decision.id,

        itemId:
          decision.itemId,

        section:
          decision.section,

        decision:
          decision.decision as RevisionReviewDecision,

        actorId:
          decision.actorId,

        actorName:
          decision.actor.name,

        actorEmail:
          decision.actor.email,

        createdAt:
          decision.createdAt.toISOString(),
      };
    },
  );
}

/**
 * The extraction pipeline already validates evidence before persistence.
 *
 * We repeat the validation at the review boundary because the candidate is
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
      if (
        item.sourceReferences.length ===
        0
      ) {
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
    !validateItems(
      scope.features,
    )
  ) {
    return false;
  }

  if (
    !validateItems(
      scope.exclusions,
    )
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
    !validateItems(
      scope.assumptions,
    )
  ) {
    return false;
  }

  for (
    const reference of
      scope.timeline.sourceReferences
  ) {
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