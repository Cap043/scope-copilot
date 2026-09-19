import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import { extractScope } from "@/lib/ai/scope/extract";

import {
  diffScopes,
} from "@/lib/scope-diff";

import {
  reconcileScopeIdentities,
} from "@/lib/scope-reconciliation";

import {
  applyManualCarryOverDecisions,
} from "@/lib/scope-carryover";

import {
  extractedScopeSchema,
  parseStoredScope,
  normalizedScopeSchema,
  validateExtractedScopeSourceReferences,
  validateScopeSourceReferences,
  type ExtractedScope,
  type NormalizedScope,
} from "@/lib/scope-schema";
export type ScopeRevisionCandidateStatus =
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "DISCARDED";

/**
 * Create an AI-extracted candidate from a newly supplied SOW.
 *
 * The candidate is intentionally NOT converted into a ScopeBaseline.
 * It remains a separate review artifact until the reconciliation workflow
 * decides how it relates to the currently approved scope.
 */
export async function createScopeRevisionCandidate(data: {
  projectId: string;
  sourceText: string;
  sourceType?: string;
}) {
  const organizationId =
    await getCurrentOrganizationId();

  const sourceText =
    data.sourceText.trim();

  if (!sourceText) {
    throw new Error(
      "Scope text cannot be empty.",
    );
  }

  // Resolve the project through the active organization first.
  // The browser cannot choose another organization's project.
  const project =
    await prisma.project.findFirst({
      where: {
        id: data.projectId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found.",
    );
  }

  // A formal SOW update must always start from an approved baseline.
  const baseBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId: project.id,
        status: "APPROVED",
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
      },
    });

  if (!baseBaseline) {
    throw new Error(
      "An approved scope baseline is required before updating the SOW.",
    );
  }

  // Gemini extracts only the new document's facts.
  // We intentionally do NOT materialize IDs/provenance here.
  const extractedScope =
    await extractScope(sourceText);

  // Validate candidate evidence against the NEW SOW text.
  // This guarantees the candidate remains auditable before persistence.
  if (
    !validateExtractedScopeSourceReferences(
      extractedScope,
      sourceText,
    )
  ) {
    throw new Error(
      "Extracted scope contains invalid source references.",
    );
  }

  const candidate =
    await prisma.scopeRevisionCandidate.create({
      data: {
        projectId: project.id,
        baseBaselineId:
          baseBaseline.id,
        status: "PENDING_REVIEW",
        sourceType:
          data.sourceType?.trim() ||
          "PASTE",
        sourceText,
        extractedScope:
          extractedScope as ExtractedScope,
      },
      select: {
        id: true,
        projectId: true,
        baseBaselineId: true,
        status: true,
        sourceType: true,
        createdAt: true,
      },
    });

  return {
    ...candidate,
    baseVersion:
      baseBaseline.version,
  };
}

/**
 * Load the latest approved baseline plus the newest pending candidate.
 *
 * This is used by the formal SOW update page to display the current
 * reconciliation starting point.
 */
export async function getScopeUpdateContext(
  projectId: string,
) {
  const organizationId =
    await getCurrentOrganizationId();

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found.",
    );
  }

  const baseBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId: project.id,
        status: "APPROVED",
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
      },
    });

  if (!baseBaseline) {
    throw new Error(
      "An approved scope baseline is required before updating the SOW.",
    );
  }

  const candidate =
    await prisma.scopeRevisionCandidate.findFirst(
      {
        where: {
          projectId: project.id,
          baseBaselineId:
            baseBaseline.id,
          status: "PENDING_REVIEW",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          sourceType: true,
          sourceText: true,
          createdAt: true,
        },
      },
    );

  return {
    project,
    baseBaseline,
    candidate,
  };
}

/**
 * Load one candidate through the active organization.
 *
 * This will be used by the later reconciliation workflow.
 */
export async function getScopeRevisionCandidate(
  candidateId: string,
) {
  const organizationId =
    await getCurrentOrganizationId();

  const candidate =
    await prisma.scopeRevisionCandidate.findFirst(
      {
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
              version: true,
              status: true,
            },
          },
        },
      },
    );

  if (!candidate) {
    throw new Error(
      "Scope revision candidate not found.",
    );
  }

  return candidate;
}
/**
 * Convert one reconciliation item into the persisted scope shape.
 *
 * Reconciliation-only fields are removed before persistence.
 * Existing manual provenance is preserved; new candidate items
 * receive document-extraction provenance.
 */
function materializeResolvedItem(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Invalid reconciled scope item.",
    );
  }

  const item = {
    ...(value as Record<string, unknown>),
  };

  // These fields only exist while resolving a revision.
  delete item.baseItemId;
  delete item.relation;

  // Carry-over manual amendments already have persistent provenance.
  if (
    typeof item.provenance === "object" &&
    item.provenance !== null &&
    typeof (
      item.provenance as Record<string, unknown>
    ).type === "string"
  ) {
    return item;
  }

  return {
    ...item,
    provenance: {
      type: "document_extraction",
    },
    status: "active",
  };
}
/**
 * Convert a resolved reconciliation scope into the canonical persisted
 * NormalizedScope representation.
 *
 * Candidate-derived items receive document provenance.
 * Manual carry-over items preserve their existing manual provenance.
 */
export function materializeReconciledScope(
  scope: {
    deliverables: unknown[];
    features: unknown[];
    exclusions: unknown[];
    clientResponsibilities: unknown[];
    revisionLimits: unknown[];
    timeline: ExtractedScope["timeline"];
    assumptions: unknown[];
  },
): NormalizedScope {
  const materializeItems = (items: unknown[]) =>
    items.map(materializeResolvedItem);

  const hasTimelineContent =
    Boolean(scope.timeline.duration?.trim()) ||
    Boolean(scope.timeline.startCondition?.trim()) ||
    scope.timeline.dependencies.length > 0 ||
    scope.timeline.sourceReferences.length > 0;

  const materialized = {
    deliverables: materializeItems(scope.deliverables),
    features: materializeItems(scope.features),
    exclusions: materializeItems(scope.exclusions),
    clientResponsibilities: materializeItems(
      scope.clientResponsibilities,
    ),
    revisionLimits: materializeItems(scope.revisionLimits),
    timeline: {
      ...scope.timeline,

      ...(hasTimelineContent
        ? {
            provenance: {
              type: "document_extraction" as const,
            },
          }
        : {}),
    },
    assumptions: materializeItems(scope.assumptions),
  };

  const parsed = normalizedScopeSchema.safeParse(materialized);

  if (!parsed.success) {
    throw new Error("Reconciled scope structure is invalid.");
  }

  return parsed.data;
}

/**
 * Finalize a reviewed revision candidate into the next DRAFT scope version.
 *
 * The browser only supplies human carry-over decisions.
 * The server re-runs reconciliation from trusted database state before
 * anything is persisted.
 */
export async function finalizeScopeRevisionCandidate(data: {
  candidateId: string;
  decisions: Record<string, "CARRY_OVER" | "REMOVE">;
}) {
  const organizationId = await getCurrentOrganizationId();

  return prisma.$transaction(async (tx) => {
    const candidate =
      await tx.scopeRevisionCandidate.findFirst({
        where: {
          id: data.candidateId,
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
        },
      });

    if (!candidate) {
      throw new Error(
        "Scope revision candidate not found.",
      );
    }

    if (candidate.status !== "PENDING_REVIEW") {
      throw new Error(
        "Only pending scope revisions can be finalized.",
      );
    }

    const baseBaseline =
      await tx.scopeBaseline.findFirst({
        where: {
          id: candidate.baseBaselineId,
          projectId: candidate.projectId,
          status: "APPROVED",
        },
        select: {
          id: true,
          version: true,
          status: true,
          sourceText: true,
          structuredScope: true,
        },
      });

    if (!baseBaseline) {
      throw new Error(
        "The approved base scope for this revision no longer exists.",
      );
    }

    // The candidate must still be based on the latest approved version.
    const latestApproved =
      await tx.scopeBaseline.findFirst({
        where: {
          projectId: candidate.projectId,
          status: "APPROVED",
        },
        orderBy: {
          version: "desc",
        },
        select: {
          id: true,
          version: true,
        },
      });

    if (
      !latestApproved ||
      latestApproved.id !== baseBaseline.id
    ) {
      throw new Error(
        "This revision is stale. The project has a newer approved scope version.",
      );
    }

    // No later draft/version may have appeared while this revision
    // was under review.
    const latestBaseline =
      await tx.scopeBaseline.findFirst({
        where: {
          projectId: candidate.projectId,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          id: true,
          version: true,
          status: true,
        },
      });

    if (
      !latestBaseline ||
      latestBaseline.id !== baseBaseline.id
    ) {
      throw new Error(
        "A newer scope version already exists for this project.",
      );
    }

    const parsedBase =
      parseStoredScope(baseBaseline.structuredScope);

    if (!parsedBase.success) {
      throw new Error(
        "Base scope structure is invalid.",
      );
    }

    if (
      !validateScopeSourceReferences(
        parsedBase.data,
        baseBaseline.sourceText,
      )
    ) {
      throw new Error(
        "Base scope contains invalid source references.",
      );
    }

    const parsedCandidate =
      extractedScopeSchema.safeParse(
        candidate.extractedScope,
      );

    if (!parsedCandidate.success) {
      throw new Error(
        "Revision candidate extraction is invalid.",
      );
    }

    const candidateScope =
      parsedCandidate.data;

    if (
      !validateExtractedScopeSourceReferences(
        candidateScope,
        candidate.sourceText,
      )
    ) {
      throw new Error(
        "Revision candidate contains invalid source references.",
      );
    }

    // Re-run the complete reconciliation from trusted DB state.
    // Never trust the browser's previous diff result.
    const diff = diffScopes(
      parsedBase.data,
      candidateScope,
    );

    const reconciliation =
      reconcileScopeIdentities(
        parsedBase.data,
        candidateScope,
        diff,
      );

    // 9D applies the explicit manual carry-over decisions.
    const resolved =
      applyManualCarryOverDecisions(
        reconciliation,
        data.decisions as Parameters<
          typeof applyManualCarryOverDecisions
        >[1],
      );

    // Document-derived missing items are absent from the new SOW and
    // therefore remain omitted. Manual amendments and reappeared
    // previously-removed items are the cases that require explicit
    // reconciliation.
    const blockingUnresolved =
      resolved.unresolved.filter(
        (entry) =>
          entry.reason ===
            "REMOVED_ITEM_REAPPEARED" ||
          (
            entry.reason ===
              "MISSING_ACTIVE_ITEM" &&
            entry.entry.baseItem?.provenance
              .type === "manual_amendment"
          ),
      );

    if (blockingUnresolved.length > 0) {
      throw new Error(
        "The scope revision still contains unresolved changes.",
      );
    }

    const structuredScope =
      materializeReconciledScope(
        resolved.scope,
      );

    if (
      !validateScopeSourceReferences(
        structuredScope,
        candidate.sourceText,
      )
    ) {
      throw new Error(
        "Finalized scope contains invalid source references.",
      );
    }

    const nextVersion =
      baseBaseline.version + 1;

    const newBaseline =
      await tx.scopeBaseline.create({
        data: {
          projectId: candidate.projectId,
          version: nextVersion,
          status: "DRAFT",
          sourceType: candidate.sourceType,
          sourceText: candidate.sourceText,
          structuredScope,
        },
        select: {
          id: true,
          projectId: true,
          version: true,
          status: true,
        },
      });

    const candidateUpdate =
      await tx.scopeRevisionCandidate.updateMany({
        where: {
          id: candidate.id,
          status: "PENDING_REVIEW",
        },
        data: {
          status: "RECONCILED",
        },
      });

    if (candidateUpdate.count !== 1) {
      throw new Error(
        "Scope revision candidate changed while it was being finalized.",
      );
    }

    return {
      candidateId: candidate.id,
      projectId: newBaseline.projectId,
      baselineId: newBaseline.id,
      version: newBaseline.version,
      status: newBaseline.status,
    };
  });
}