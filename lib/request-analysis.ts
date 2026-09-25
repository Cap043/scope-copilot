import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";
import type { Prisma } from "@/lib/generated/prisma/client";

export const REQUEST_ANALYSIS_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
] as const;

export type RequestAnalysisRunStatus =
  (typeof REQUEST_ANALYSIS_RUN_STATUSES)[number];

export type AnalysisResultSnapshot =
  Prisma.InputJsonObject;

type CreateRequestAnalysisRunInput = {
  clientRequestItemId: string;
  provider: string;
  model: string;
  promptVersion: string;
  analysisVersion: string;
};

type CompleteRequestAnalysisRunInput = {
  runId: string;
  resultSnapshot: AnalysisResultSnapshot;
};

type FailRequestAnalysisRunInput = {
  runId: string;
  errorMessage: string;
};

/**
 * Load a request item only when it belongs to the
 * currently authenticated organization.
 */
async function getAuthorizedRequestItem(
  clientRequestItemId: string,
) {
  const organizationId =
    await getCurrentOrganizationId();

  const item =
    await prisma.clientRequestItem.findFirst({
      where: {
        id: clientRequestItemId,
        clientRequest: {
          project: {
            organizationId,
          },
        },
      },
      include: {
        clientRequest: {
          include: {
            project: true,
          },
        },
      },
    });

  if (!item) {
    throw new Error(
      "Client request item not found.",
    );
  }

  return {
    organizationId,
    item,
  };
}

/**
 * Load an analysis run only when its request item
 * belongs to the currently authenticated organization.
 */
async function getAuthorizedAnalysisRun(
  runId: string,
) {
  const organizationId =
    await getCurrentOrganizationId();

  const run =
    await prisma.requestAnalysisRun.findFirst({
      where: {
        id: runId,
        clientRequestItem: {
          clientRequest: {
            project: {
              organizationId,
            },
          },
        },
      },
      include: {
        clientRequestItem: {
          include: {
            clientRequest: {
              include: {
                project: true,
              },
            },
          },
        },
        scopeBaseline: true,
      },
    });

  if (!run) {
    throw new Error(
      "Request analysis run not found.",
    );
  }

  return {
    organizationId,
    run,
  };
}

/**
 * Create an analysis run for a client request item.
 *
 * The caller does not provide a scopeBaselineId.
 * The exact baseline is derived from the parent
 * ClientRequest's pinned approved baseline.
 */
export async function createRequestAnalysisRun(
  input: CreateRequestAnalysisRunInput,
) {
  const { organizationId, item } =
    await getAuthorizedRequestItem(
      input.clientRequestItemId,
    );

  const pinnedBaselineId =
    item.clientRequest.analyzedAgainstBaselineId;

  const scopeBaseline =
    await prisma.scopeBaseline.findFirst({
      where: {
        id: pinnedBaselineId,
        projectId: item.clientRequest.projectId,
        project: {
          organizationId,
        },
      },
    });

  if (!scopeBaseline) {
    throw new Error(
      "Pinned scope baseline not found.",
    );
  }

  if (scopeBaseline.status !== "APPROVED") {
    throw new Error(
      "Client request analysis must use an approved scope baseline.",
    );
  }

  return prisma.requestAnalysisRun.create({
    data: {
      clientRequestItemId: item.id,
      scopeBaselineId: scopeBaseline.id,
      status: "PENDING",
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      analysisVersion: input.analysisVersion,
    },
  });
}

/**
 * Move a PENDING analysis run into RUNNING state.
 */
export async function startRequestAnalysisRun(
  runId: string,
) {
  const { run } =
    await getAuthorizedAnalysisRun(runId);

  if (run.status !== "PENDING") {
    throw new Error(
      `Cannot start analysis run from ${run.status} state.`,
    );
  }

  return prisma.requestAnalysisRun.update({
    where: {
      id: run.id,
    },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

/**
 * Persist the analysis result snapshot and complete
 * the analysis run.
 */
export async function completeRequestAnalysisRun(
  input: CompleteRequestAnalysisRunInput,
) {
  const { run } =
    await getAuthorizedAnalysisRun(input.runId);

  if (run.status !== "RUNNING") {
    throw new Error(
      `Cannot complete analysis run from ${run.status} state.`,
    );
  }

  return prisma.requestAnalysisRun.update({
    where: {
      id: run.id,
    },
    data: {
      status: "COMPLETED",
      resultSnapshot: input.resultSnapshot,
      completedAt: new Date(),
      errorMessage: null,
    },
  });
}

/**
 * Mark a running analysis as failed while preserving
 * the failed run as an auditable historical record.
 */
export async function failRequestAnalysisRun(
  input: FailRequestAnalysisRunInput,
) {
  const { run } =
    await getAuthorizedAnalysisRun(input.runId);

  if (run.status !== "RUNNING") {
    throw new Error(
      `Cannot fail analysis run from ${run.status} state.`,
    );
  }

  return prisma.requestAnalysisRun.update({
    where: {
      id: run.id,
    },
    data: {
      status: "FAILED",
      errorMessage: input.errorMessage,
    },
  });
}

/**
 * Get all analysis runs belonging to one request item.
 *
 * Newest runs are returned first.
 */
export async function getRequestAnalysisRuns(
  clientRequestItemId: string,
) {
  await getAuthorizedRequestItem(
    clientRequestItemId,
  );

  return prisma.requestAnalysisRun.findMany({
    where: {
      clientRequestItemId,
    },
    include: {
      scopeBaseline: {
        select: {
          id: true,
          version: true,
          status: true,
          projectId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get one analysis run together with its request item,
 * parent request, project, and exact scope baseline.
 */
export async function getRequestAnalysisRun(
  runId: string,
) {
  const { run } =
    await getAuthorizedAnalysisRun(runId);

  return run;
}