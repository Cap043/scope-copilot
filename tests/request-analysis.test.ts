import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getCurrentOrganizationId,
} = vi.hoisted(() => ({
  getCurrentOrganizationId:
    vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId,
}));

import { prisma } from "@/lib/db";

import {
  completeRequestAnalysisRun,
  createRequestAnalysisRun,
  failRequestAnalysisRun,
  getRequestAnalysisRun,
  getRequestAnalysisRuns,
  startRequestAnalysisRun,
} from "@/lib/request-analysis";

const createdOrganizationIds: string[] = [];
const createdProjectIds: string[] = [];

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function createTestOrganization() {
  const id = uniqueId("analysis-test-org");

  const organization =
    await prisma.organization.create({
      data: {
        id,
        name: `Analysis Test ${id}`,
        slug: uniqueId(
          "analysis-test-slug",
        ),
      },
    });

  createdOrganizationIds.push(
    organization.id,
  );

  return organization;
}

async function createTestProject(
  organizationId: string,
) {
  const client =
    await prisma.client.create({
      data: {
        name: "Analysis Test Client",
        organizationId,
      },
    });

  const project =
    await prisma.project.create({
      data: {
        name: `Analysis Test Project ${uniqueId(
          "project",
        )}`,
        value: 10000,
        organizationId,
        clientId: client.id,
      },
    });

  createdProjectIds.push(project.id);

  return project;
}

async function createScopeBaseline(
  projectId: string,
  version: number,
  status: string = "APPROVED",
) {
  return prisma.scopeBaseline.create({
    data: {
      projectId,
      version,
      status,
      sourceType: "PASTE",
      sourceText: `Test SOW version ${version}`,
      structuredScope: {
        deliverables: [],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      },
      approvedAt:
        status === "APPROVED"
          ? new Date()
          : undefined,
    },
  });
}

async function createTestRequest(
  projectId: string,
  baselineId: string,
) {
  return prisma.clientRequest.create({
    data: {
      projectId,
      analyzedAgainstBaselineId:
        baselineId,
      originalText:
        "Please add a customer dashboard.",
      status: "NEW",
    },
  });
}

async function createTestRequestItem(
  clientRequestId: string,
) {
  return prisma.clientRequestItem.create({
    data: {
      clientRequestId,
      position: 1,
      text: "Add a customer dashboard.",
    },
  });
}

describe("RequestAnalysisRun persistence", () => {
  beforeEach(() => {
    getCurrentOrganizationId.mockReset();
  });

  afterEach(async () => {
    if (createdProjectIds.length > 0) {
      /*
       * Cleanup must follow the actual FK dependency graph:
       *
       * RequestAnalysisRun
       *      ↓
       * ClientRequestItem
       *      ↓
       * ClientRequest
       *      ↓
       * ScopeBaseline
       *      ↓
       * Project
       */

      await prisma.requestAnalysisRun.deleteMany({
        where: {
          clientRequestItem: {
            clientRequest: {
              projectId: {
                in: createdProjectIds,
              },
            },
          },
        },
      });

      await prisma.clientRequestItem.deleteMany({
        where: {
          clientRequest: {
            projectId: {
              in: createdProjectIds,
            },
          },
        },
      });

      await prisma.clientRequest.deleteMany({
        where: {
          projectId: {
            in: createdProjectIds,
          },
        },
      });

      await prisma.scopeBaseline.deleteMany({
        where: {
          projectId: {
            in: createdProjectIds,
          },
        },
      });

      await prisma.project.deleteMany({
        where: {
          id: {
            in: createdProjectIds,
          },
        },
      });
    }

    if (createdOrganizationIds.length > 0) {
      await prisma.client.deleteMany({
        where: {
          organizationId: {
            in: createdOrganizationIds,
          },
        },
      });

      await prisma.organization.deleteMany({
        where: {
          id: {
            in: createdOrganizationIds,
          },
        },
      });
    }

    createdProjectIds.length = 0;
    createdOrganizationIds.length = 0;
  });

  it("creates an analysis run using the exact baseline pinned by the request", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        4,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const run =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "gemini-flash-lite-latest",
        promptVersion:
          "scope-comparison-v1",
        analysisVersion:
          "request-analysis-v1",
      });

    expect(run.id).toBeTruthy();

    expect(
      run.clientRequestItemId,
    ).toBe(item.id);

    expect(
      run.scopeBaselineId,
    ).toBe(baseline.id);

    expect(run.status).toBe(
      "PENDING",
    );

    expect(run.provider).toBe(
      "gemini",
    );

    expect(run.model).toBe(
      "gemini-flash-lite-latest",
    );

    expect(run.promptVersion).toBe(
      "scope-comparison-v1",
    );

    expect(run.analysisVersion).toBe(
      "request-analysis-v1",
    );
  });

  it("does not allow a caller to choose a different baseline", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const pinnedBaseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const otherBaseline =
      await createScopeBaseline(
        project.id,
        2,
      );

    const request =
      await createTestRequest(
        project.id,
        pinnedBaseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const run =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    expect(
      run.scopeBaselineId,
    ).toBe(pinnedBaseline.id);

    expect(
      run.scopeBaselineId,
    ).not.toBe(otherBaseline.id);
  });

  it("refuses to create an analysis run when the pinned baseline is no longer approved", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    await prisma.scopeBaseline.update({
      where: {
        id: baseline.id,
      },
      data: {
        status: "DRAFT",
        approvedAt: null,
      },
    });

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    await expect(
      createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      }),
    ).rejects.toThrow(
      "Client request analysis must use an approved scope baseline.",
    );
  });

  it("runs through the PENDING to RUNNING to COMPLETED lifecycle", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const createdRun =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    expect(
      createdRun.status,
    ).toBe("PENDING");

    const startedRun =
      await startRequestAnalysisRun(
        createdRun.id,
      );

    expect(
      startedRun.status,
    ).toBe("RUNNING");

    expect(
      startedRun.startedAt,
    ).not.toBeNull();

    const resultSnapshot = {
      scopeRelationship:
        "DIRECTLY_INCLUDED",
      evidence: [
        {
          scopeItemId:
            "feature-1",
          reason:
            "The approved scope already includes the dashboard.",
        },
      ],
      confidence: "HIGH",
    };

    const completedRun =
      await completeRequestAnalysisRun({
        runId: createdRun.id,
        resultSnapshot,
      });

    expect(
      completedRun.status,
    ).toBe("COMPLETED");

    expect(
      completedRun.completedAt,
    ).not.toBeNull();

    expect(
      completedRun.resultSnapshot,
    ).toEqual(resultSnapshot);

    const storedRun =
      await getRequestAnalysisRun(
        createdRun.id,
      );

    expect(
      storedRun.status,
    ).toBe("COMPLETED");

    expect(
      storedRun.resultSnapshot,
    ).toEqual(resultSnapshot);
  });

  it("runs through the PENDING to RUNNING to FAILED lifecycle", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const createdRun =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    await startRequestAnalysisRun(
      createdRun.id,
    );

    const failedRun =
      await failRequestAnalysisRun({
        runId: createdRun.id,
        errorMessage:
          "Test analysis failure.",
      });

    expect(failedRun.status).toBe(
      "FAILED",
    );

    expect(
      failedRun.errorMessage,
    ).toBe(
      "Test analysis failure.",
    );
  });

  it("rejects invalid lifecycle transitions", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const run =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    await expect(
      completeRequestAnalysisRun({
        runId: run.id,
        resultSnapshot: {
          test: true,
        },
      }),
    ).rejects.toThrow(
      "Cannot complete analysis run from PENDING state.",
    );

    await expect(
      failRequestAnalysisRun({
        runId: run.id,
        errorMessage:
          "Should not be allowed.",
      }),
    ).rejects.toThrow(
      "Cannot fail analysis run from PENDING state.",
    );

    await startRequestAnalysisRun(
      run.id,
    );

    await expect(
      startRequestAnalysisRun(
        run.id,
      ),
    ).rejects.toThrow(
      "Cannot start analysis run from RUNNING state.",
    );
  });

  it("returns analysis history newest first", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baseline =
      await createScopeBaseline(
        project.id,
        1,
      );

    const request =
      await createTestRequest(
        project.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const firstRun =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    await startRequestAnalysisRun(
      firstRun.id,
    );

    await completeRequestAnalysisRun({
      runId: firstRun.id,
      resultSnapshot: {
        run: 1,
      },
    });

    const secondRun =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v2",
        analysisVersion:
          "test-analysis-v2",
      });

    const runs =
      await getRequestAnalysisRuns(
        item.id,
      );

    expect(runs).toHaveLength(2);

    expect(runs[0].id).toBe(
      secondRun.id,
    );

    expect(runs[1].id).toBe(
      firstRun.id,
    );
  });

  it("enforces organization isolation", async () => {
    const organizationA =
      await createTestOrganization();

    const organizationB =
      await createTestOrganization();

    const projectA =
      await createTestProject(
        organizationA.id,
      );

    const baseline =
      await createScopeBaseline(
        projectA.id,
        1,
      );

    const request =
      await createTestRequest(
        projectA.id,
        baseline.id,
      );

    const item =
      await createTestRequestItem(
        request.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organizationA.id,
    );

    const run =
      await createRequestAnalysisRun({
        clientRequestItemId: item.id,
        provider: "gemini",
        model: "test-model",
        promptVersion:
          "test-prompt-v1",
        analysisVersion:
          "test-analysis-v1",
      });

    expect(run.id).toBeTruthy();

    getCurrentOrganizationId.mockResolvedValue(
      organizationB.id,
    );

    await expect(
      getRequestAnalysisRun(
        run.id,
      ),
    ).rejects.toThrow(
      "Request analysis run not found.",
    );

    await expect(
      getRequestAnalysisRuns(
        item.id,
      ),
    ).rejects.toThrow(
      "Client request item not found.",
    );

    await expect(
      startRequestAnalysisRun(
        run.id,
      ),
    ).rejects.toThrow(
      "Request analysis run not found.",
    );
  });
});