import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import {
  parseStoredScope,
  validateScopeSourceReferences,
  type NormalizedScope,
} from "@/lib/scope-schema";

export type ScopeVersionHistoryItem = {
  id: string;
  version: number;
  status: string;
  sourceType: string;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // The most recent revision candidate associated with this version.
  revisionCandidateStatus: string | null;

  // UI semantics derived from the complete version history.
  isLatest: boolean;
  isCurrentApproved: boolean;
};

export type ScopeVersion = {
  id: string;
  projectId: string;
  version: number;
  status: string;
  sourceType: string;
  sourceText: string;
  structuredScope: unknown;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  scope: NormalizedScope;
};

/**
 * Load every scope version belonging to the authenticated organization.
 *
 * This is intentionally a metadata-only query. Historical scope content
 * is loaded separately when the user opens one specific version.
 */
export async function getScopeVersionHistory(
  projectId: string,
): Promise<ScopeVersionHistoryItem[]> {
  const organizationId =
    await getCurrentOrganizationId();

  const baselines =
    await prisma.scopeBaseline.findMany({
      where: {
        projectId,
        project: {
          organizationId,
        },
      },

      // Highest version first so the UI naturally reads newest → oldest.
      orderBy: {
        version: "desc",
      },

      select: {
        id: true,
        version: true,
        status: true,
        sourceType: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,

        // A version can have multiple revision candidates over time.
        // The newest one is enough for the history summary.
        revisionCandidates: {
          select: {
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

  const latestVersion =
    baselines[0]?.version ?? null;

  const currentApprovedVersion =
    baselines.find(
      (baseline) =>
        baseline.status === "APPROVED",
    )?.version ?? null;

  return baselines.map(
    (baseline) => ({
      id: baseline.id,
      version: baseline.version,
      status: baseline.status,
      sourceType: baseline.sourceType,
      approvedAt: baseline.approvedAt,
      createdAt: baseline.createdAt,
      updatedAt: baseline.updatedAt,

      revisionCandidateStatus:
        baseline.revisionCandidates[0]
          ?.status ?? null,

      isLatest:
        baseline.version === latestVersion,

      isCurrentApproved:
        baseline.version ===
          currentApprovedVersion &&
        baseline.status === "APPROVED",
    }),
  );
}

/**
 * Load one exact scope version.
 *
 * Organization ownership is enforced through the project relation.
 * The persisted scope is parsed and evidence-validated before it is
 * exposed to the historical viewer.
 */
export async function getScopeVersion(
  projectId: string,
  version: number,
): Promise<ScopeVersion> {
  const organizationId =
    await getCurrentOrganizationId();

  const baseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId,
        version,
        project: {
          organizationId,
        },
      },

      select: {
        id: true,
        projectId: true,
        version: true,
        status: true,
        sourceType: true,
        sourceText: true,
        structuredScope: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!baseline) {
    throw new Error(
      "Scope version not found.",
    );
  }

  // Legacy records are normalized through the existing compatibility
  // parser before historical data reaches the UI.
  const parsed = parseStoredScope(
    baseline.structuredScope,
  );

  if (!parsed.success) {
    throw new Error(
      "Scope version structure is invalid.",
    );
  }

  // Historical versions must remain auditable against the exact source
  // text stored with that version.
  if (
    !validateScopeSourceReferences(
      parsed.data,
      baseline.sourceText,
    )
  ) {
    throw new Error(
      "Scope version contains invalid source references.",
    );
  }

  return {
    ...baseline,
    scope: parsed.data,
  };
}
