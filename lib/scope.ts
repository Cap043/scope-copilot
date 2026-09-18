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

/**
 * These are the scope sections that contain independently identifiable
 * items. Timeline is intentionally excluded because it is a singleton.
 */
export type ScopeArraySection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities"
  | "revisionLimits"
  | "assumptions";

type ScopeArrayItem =
  NormalizedScope[ScopeArraySection][number];

type StandardManualItemInput = {
  title: string;
  description?: string;
};

type RevisionLimitManualItemInput = {
  type: string;
  limit: string;
};

type AssumptionManualItemInput = {
  statement: string;
};

type ManualItemInput =
  | StandardManualItemInput
  | RevisionLimitManualItemInput
  | AssumptionManualItemInput;

/**
 * Gemini only returns extraction data.
 *
 * Persistent identity and lifecycle metadata belong to the application,
 * so Gemini can never invent historical IDs or provenance.
 */
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

/**
 * Resolve a draft baseline through the current organization and parse
 * its persisted JSON into the canonical normalized representation.
 *
 * Every mutation in this file goes through this boundary first.
 */
async function getDraftBaseline(
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
        projectId: true,
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

  if (baseline.status !== "DRAFT") {
    throw new Error(
      "Only draft scope baselines can be modified.",
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

  return {
    ...baseline,
    structuredScope: parsed.data,
  };
}

/**
 * Persist a fully validated scope mutation.
 *
 * We validate again immediately before writing so every mutation has the
 * same evidence and structural guarantees as the approval boundary.
 */
async function persistDraftScope(
  baseline: {
    id: string;
    sourceText: string;
  },
  scope: NormalizedScope,
) {
  if (
    !validateScopeSourceReferences(
      scope,
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
      structuredScope: scope,
    },
  });
}

/**
 * Find an item inside one of the array-based scope sections.
 */
function findScopeItem(
  scope: NormalizedScope,
  section: ScopeArraySection,
  itemId: string,
) {
  const items =
    scope[section] as ScopeArrayItem[];

  const index = items.findIndex(
    (item) => item.id === itemId,
  );

  if (index === -1) {
    throw new Error(
      "Scope item not found.",
    );
  }

  return {
    items,
    index,
    item: items[index],
  };
}

/**
 * Add a brand-new scope item manually.
 *
 * Manual additions never receive fake SOW evidence. Their provenance
 * explicitly records why the agency accepted the addition.
 */
export async function addManualScopeItem(data: {
  baselineId: string;
  section: ScopeArraySection;
  item: ManualItemInput;
  rationale: string;
  referenceId: string;
}) {
  const baseline =
    await getDraftBaseline(
      data.baselineId,
    );

  const rationale =
    data.rationale.trim();

  const referenceId =
    data.referenceId.trim();

  if (!rationale) {
    throw new Error(
      "Amendment rationale is required.",
    );
  }

  if (!referenceId) {
    throw new Error(
      "Amendment reference is required.",
    );
  }

  let newItem: ScopeArrayItem;

  switch (data.section) {
    case "deliverables":
    case "features":
    case "exclusions":
    case "clientResponsibilities": {
      const item =
        data.item as StandardManualItemInput;

      const title =
        item.title.trim();

      if (!title) {
        throw new Error(
          "Title cannot be empty.",
        );
      }

      newItem = {
        title,
        description:
          item.description?.trim() ||
          undefined,
        sourceReferences: [],
        id: randomUUID(),
        provenance: {
          type: "manual_amendment",
          rationale,
          referenceId,
        },
        status: "active",
      } as ScopeArrayItem;

      break;
    }

    case "revisionLimits": {
      const item =
        data.item as RevisionLimitManualItemInput;

      const type =
        item.type.trim();

      const limit =
        item.limit.trim();

      if (!type || !limit) {
        throw new Error(
          "Revision limit type and limit cannot be empty.",
        );
      }

      newItem = {
        type,
        limit,
        sourceReferences: [],
        id: randomUUID(),
        provenance: {
          type: "manual_amendment",
          rationale,
          referenceId,
        },
        status: "active",
      } as ScopeArrayItem;

      break;
    }

    case "assumptions": {
      const item =
        data.item as AssumptionManualItemInput;

      const statement =
        item.statement.trim();

      if (!statement) {
        throw new Error(
          "Assumption statement cannot be empty.",
        );
      }

      newItem = {
        statement,
        sourceReferences: [],
        id: randomUUID(),
        provenance: {
          type: "manual_amendment",
          rationale,
          referenceId,
        },
        status: "active",
      } as ScopeArrayItem;

      break;
    }

    default:
      throw new Error(
        "Unsupported scope section.",
      );
  }

  const updatedScope = {
    ...baseline.structuredScope,
    [data.section]: [
      ...(baseline.structuredScope[
        data.section
      ] as ScopeArrayItem[]),
      newItem,
    ],
  } as NormalizedScope;

  const updated =
    await persistDraftScope(
      baseline,
      updatedScope,
    );

  return {
    baseline: updated,
    itemId: newItem.id,
  };
}

/**
 * Edit the meaning of an existing scope item.
 *
 * Document-derived items retain their original document provenance and
 * receive amendment metadata. This preserves the distinction between
 * "where the item came from" and "why its meaning changed".
 *
 * Manual items remain manual amendments. Their version-local provenance
 * records the reason/reference for the latest manual change.
 */
export async function amendScopeItem(data: {
  baselineId: string;
  section: ScopeArraySection;
  itemId: string;
  changes:
    | StandardManualItemInput
    | RevisionLimitManualItemInput
    | AssumptionManualItemInput;
  rationale: string;
  referenceId: string;
}) {
  const baseline =
    await getDraftBaseline(
      data.baselineId,
    );

  const rationale =
    data.rationale.trim();

  const referenceId =
    data.referenceId.trim();

  if (!rationale) {
    throw new Error(
      "Amendment rationale is required.",
    );
  }

  if (!referenceId) {
    throw new Error(
      "Amendment reference is required.",
    );
  }

  const {
    items,
    index,
    item,
  } = findScopeItem(
    baseline.structuredScope,
    data.section,
    data.itemId,
  );

  if (item.status !== "active") {
    throw new Error(
      "Removed scope items cannot be amended.",
    );
  }

  let updatedItem: ScopeArrayItem;

  switch (data.section) {
    case "deliverables":
    case "features":
    case "exclusions":
    case "clientResponsibilities": {
      const changes =
        data.changes as StandardManualItemInput;

      const title =
        changes.title.trim();

      if (!title) {
        throw new Error(
          "Title cannot be empty.",
        );
      }

      updatedItem = {
        ...item,
        title,
        description:
          changes.description?.trim() ||
          undefined,
      } as ScopeArrayItem;

      break;
    }

    case "revisionLimits": {
      const changes =
        data.changes as RevisionLimitManualItemInput;

      const type =
        changes.type.trim();

      const limit =
        changes.limit.trim();

      if (!type || !limit) {
        throw new Error(
          "Revision limit type and limit cannot be empty.",
        );
      }

      updatedItem = {
        ...item,
        type,
        limit,
      } as ScopeArrayItem;

      break;
    }

    case "assumptions": {
      const changes =
        data.changes as AssumptionManualItemInput;

      const statement =
        changes.statement.trim();

      if (!statement) {
        throw new Error(
          "Assumption statement cannot be empty.",
        );
      }

      updatedItem = {
        ...item,
        statement,
      } as ScopeArrayItem;

      break;
    }

    default:
      throw new Error(
        "Unsupported scope section.",
      );
  }

  // Evidence is immutable. A caller can change semantic fields but can
  // never replace the original document evidence through this operation.
  updatedItem.sourceReferences =
    item.sourceReferences;

  if (
    item.provenance.type ===
    "document_extraction"
  ) {
    updatedItem.provenance = {
      type: "document_extraction",
    };

    updatedItem.amendment = {
      rationale,
      referenceId,
    };
  } else {
    updatedItem.provenance = {
      type: "manual_amendment",
      rationale,
      referenceId,
    };

    // Manual items keep their rationale/reference in provenance.
    delete updatedItem.amendment;
  }

  updatedItem.status = "active";
  delete updatedItem.removal;

  items[index] = updatedItem;

  const updatedScope = {
    ...baseline.structuredScope,
    [data.section]:
      items,
  } as NormalizedScope;

  const updated =
    await persistDraftScope(
      baseline,
      updatedScope,
    );

  return {
    baseline: updated,
    itemId: data.itemId,
  };
}

/**
 * Tombstone an item instead of deleting it from the version snapshot.
 *
 * The item retains its identity, provenance, and original evidence.
 * Only its lifecycle state changes.
 */
export async function removeScopeItem(data: {
  baselineId: string;
  section: ScopeArraySection;
  itemId: string;
  rationale: string;
  referenceId: string;
}) {
  const baseline =
    await getDraftBaseline(
      data.baselineId,
    );

  const rationale =
    data.rationale.trim();

  const referenceId =
    data.referenceId.trim();

  if (!rationale) {
    throw new Error(
      "Removal rationale is required.",
    );
  }

  if (!referenceId) {
    throw new Error(
      "Removal reference is required.",
    );
  }

  const {
    items,
    index,
    item,
  } = findScopeItem(
    baseline.structuredScope,
    data.section,
    data.itemId,
  );

  if (item.status === "removed") {
    throw new Error(
      "Scope item is already removed.",
    );
  }

  items[index] = {
    ...item,
    status: "removed",
    removal: {
      rationale,
      referenceId,
    },
  } as ScopeArrayItem;

  const updatedScope = {
    ...baseline.structuredScope,
    [data.section]:
      items,
  } as NormalizedScope;

  const updated =
    await persistDraftScope(
      baseline,
      updatedScope,
    );

  return {
    baseline: updated,
    itemId: data.itemId,
  };
}

/**
 * Timeline has no item ID because it is a singleton.
 *
 * Document-derived timeline content keeps its source evidence and receives
 * amendment metadata when its meaning changes. Manual timeline changes use
 * manual provenance and therefore carry no fake document evidence.
 */
export async function amendScopeTimeline(data: {
  baselineId: string;
  duration?: string;
  startCondition?: string;
  dependencies: string[];
  rationale: string;
  referenceId: string;
}) {
  const baseline =
    await getDraftBaseline(
      data.baselineId,
    );

  const rationale =
    data.rationale.trim();

  const referenceId =
    data.referenceId.trim();

  if (!rationale) {
    throw new Error(
      "Amendment rationale is required.",
    );
  }

  if (!referenceId) {
    throw new Error(
      "Amendment reference is required.",
    );
  }

  const duration =
    data.duration?.trim() ||
    undefined;

  const startCondition =
    data.startCondition?.trim() ||
    undefined;

  const dependencies =
    data.dependencies
      .map((dependency) =>
        dependency.trim(),
      )
      .filter(Boolean);

  if (
    !duration &&
    !startCondition &&
    dependencies.length === 0
  ) {
    throw new Error(
      "Timeline must contain at least one value.",
    );
  }

  const timeline =
    baseline.structuredScope.timeline;

  const updatedTimeline = {
    ...timeline,
    duration,
    startCondition,
    dependencies,
  };

  if (
    timeline.provenance?.type ===
    "document_extraction"
  ) {
    updatedTimeline.provenance = {
      type: "document_extraction",
    };

    updatedTimeline.amendment = {
      rationale,
      referenceId,
    };
  } else {
    updatedTimeline.sourceReferences = [];

    updatedTimeline.provenance = {
      type: "manual_amendment",
      rationale,
      referenceId,
    };

    delete updatedTimeline.amendment;
  }

  const updatedScope = {
    ...baseline.structuredScope,
    timeline:
      updatedTimeline,
  } as NormalizedScope;

  const updated =
    await persistDraftScope(
      baseline,
      updatedScope,
    );

  return {
    baseline: updated,
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
      // Copy the approved snapshot exactly. IDs and provenance therefore
      // survive into the next version unless a later amendment changes them.
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

  // Keep the existing generic persistence path temporarily for the
  // current review UI. New amendment-aware UI operations should use
  // addManualScopeItem/amendScopeItem/removeScopeItem/amendScopeTimeline.
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