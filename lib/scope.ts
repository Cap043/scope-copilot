import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import { extractScope } from "@/lib/ai/scope/extract";

import {
  parseStoredScope,
  validateScopeSourceReferences,
  type ExtractedScope,
  type NormalizedScope,
} from "@/lib/scope-schema";
function materializeExtractedScope(
  scope: ExtractedScope,
): NormalizedScope {
  const materializeItem = <
    T extends {
      title: string;
      description?: string;
      sourceReferences: Array<{
        quote: string;
        section?: string;
      }>;
    },
  >(
    item: T,
  ) => ({
    ...item,
    id: randomUUID(),
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  });

  const hasTimelineContent =
    Boolean(scope.timeline.duration?.trim()) ||
    Boolean(
      scope.timeline.startCondition?.trim(),
    ) ||
    scope.timeline.dependencies.length > 0 ||
    scope.timeline.sourceReferences.length > 0;

  return {
    deliverables:
      scope.deliverables.map(
        materializeItem,
      ),

    features:
      scope.features.map(
        materializeItem,
      ),

    exclusions:
      scope.exclusions.map(
        materializeItem,
      ),

    clientResponsibilities:
      scope.clientResponsibilities.map(
        materializeItem,
      ),

    revisionLimits:
      scope.revisionLimits.map(
        (item) => ({
          ...item,
          id: randomUUID(),
          provenance: {
            type:
              "document_extraction" as const,
          },
          status: "active" as const,
        }),
      ),

    timeline: {
      ...scope.timeline,

      ...(hasTimelineContent
        ? {
            provenance: {
              type:
                "document_extraction" as const,
            },
          }
        : {}),
    },

    assumptions:
      scope.assumptions.map(
        (item) => ({
          ...item,
          id: randomUUID(),
          provenance: {
            type:
              "document_extraction" as const,
          },
          status: "active" as const,
        }),
      ),
  };
}

export async function createScopeBaseline(data: {
  projectId: string;
  sourceText: string;
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

  // Enforce organization ownership before processing or persisting scope.
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

  // Gemini performs document extraction only.
  const extractedScope =
    await extractScope(sourceText);

  // The application assigns persistent identity and document provenance.
  const structuredScope =
    materializeExtractedScope(
      extractedScope,
    );

  // The persisted scope must pass the same strict evidence validation
  // before it becomes a database record.
  if (
    !validateScopeSourceReferences(
      structuredScope,
      sourceText,
    )
  ) {
    throw new Error(
      "Extracted scope contains invalid source references.",
    );
  }

  const latestBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId: project.id,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

  const version =
    (latestBaseline?.version ?? 0) + 1;

  return prisma.scopeBaseline.create({
    data: {
      projectId: project.id,
      version,
      status: "DRAFT",
      sourceType: "PASTE",
      sourceText,
      structuredScope,
    },
  });
}

export async function createScopeVersion(
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
      },
    });

  if (!project) {
    throw new Error(
      "Project not found.",
    );
  }

  // Always create the next version from the latest approved version.
  const latestBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        projectId: project.id,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        status: true,
        sourceType: true,
        sourceText: true,
        structuredScope: true,
      },
    });

  if (!latestBaseline) {
    throw new Error(
      "No scope baseline exists for this project.",
    );
  }

  if (
    latestBaseline.status !==
    "APPROVED"
  ) {
    throw new Error(
      "The current scope version must be approved before creating a new version.",
    );
  }

  // Legacy approved records are normalized here while we migrate the
  // database to the canonical persisted representation.
  const parsed = parseStoredScope(
    latestBaseline.structuredScope,
  );

  if (!parsed.success) {
    throw new Error(
      "Scope structure is invalid.",
    );
  }

  const structuredScope =
    parsed.data;

  if (
    !validateScopeSourceReferences(
      structuredScope,
      latestBaseline.sourceText,
    )
  ) {
    throw new Error(
      "Scope contains invalid source references.",
    );
  }

  return prisma.scopeBaseline.create({
    data: {
      projectId: project.id,
      version:
        latestBaseline.version + 1,
      status: "DRAFT",
      sourceType:
        latestBaseline.sourceType,
      sourceText:
        latestBaseline.sourceText,
      structuredScope,
    },
  });
}

export async function updateScopeBaseline(data: {
  baselineId: string;
  structuredScope: unknown;
}) {
  const organizationId =
    await getCurrentOrganizationId();

  const baseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        id: data.baselineId,
        project: {
          organizationId,
        },
      },
      select: {
        id: true,
        status: true,
        sourceText: true,
      },
    });

  if (!baseline) {
    throw new Error(
      "Scope baseline not found.",
    );
  }

  if (
    baseline.status !== "DRAFT"
  ) {
    throw new Error(
      "Only draft scope baselines can be edited.",
    );
  }

  // Accept canonical scope data and legacy data while the migration is
  // being completed.
  const parsed = parseStoredScope(
    data.structuredScope,
  );

  if (!parsed.success) {
    throw new Error(
      "Invalid scope structure.",
    );
  }

  if (
    !validateScopeSourceReferences(
      parsed.data,
      baseline.sourceText,
    )
  ) {
    throw new Error(
      "Scope contains invalid source references.",
    );
  }

  return prisma.scopeBaseline.update({
    where: {
      id: baseline.id,
    },
    data: {
      structuredScope: parsed.data,
    },
  });
}

export async function approveScopeBaseline(
  baselineId: string,
) {
  const organizationId =
    await getCurrentOrganizationId();

  const baseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        id: baselineId,
        project: {
          organizationId,
        },
      },
      select: {
        id: true,
        status: true,
        sourceText: true,
        structuredScope: true,
      },
    });

  if (!baseline) {
    throw new Error(
      "Scope baseline not found.",
    );
  }

  if (
    baseline.status !==
    "DRAFT"
  ) {
    throw new Error(
      "Only draft scope baselines can be approved.",
    );
  }

  const parsed = parseStoredScope(
    baseline.structuredScope,
  );

  if (!parsed.success) {
    throw new Error(
      "Scope structure is invalid.",
    );
  }

  if (
    !validateScopeSourceReferences(
      parsed.data,
      baseline.sourceText,
    )
  ) {
    throw new Error(
      "Scope contains invalid source references.",
    );
  }

  return prisma.scopeBaseline.update({
    where: {
      id: baseline.id,
    },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      structuredScope: parsed.data,
    },
  });
}