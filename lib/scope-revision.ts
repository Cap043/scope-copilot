import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import { extractScope } from "@/lib/ai/scope/extract";
import {
  validateExtractedScopeSourceReferences,
  type ExtractedScope,
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