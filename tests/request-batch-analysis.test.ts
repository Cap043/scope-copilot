import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getClientRequest,
  getRequestAnalysisRuns,
  analyzeRequestScope,
  revalidatePath,
} = vi.hoisted(() => ({
  getClientRequest: vi.fn(),
  getRequestAnalysisRuns: vi.fn(),
  analyzeRequestScope: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/requests", () => ({
  createClientRequest: vi.fn(),
  getClientRequest,
  saveClientRequestItems: vi.fn(),
}));

vi.mock("@/lib/ai/request/decompose", () => ({
  decomposeClientRequestText: vi.fn(),
}));

vi.mock("@/lib/ai/request/analyze-scope", () => ({
  analyzeRequestScope,
}));

vi.mock("@/lib/request-analysis", () => ({
  getRequestAnalysisRuns,
}));

import {
  analyzeClientRequestItemsAction,
} from "@/app/(dashboard)/projects/[projectId]/requests/actions";

function createRequest() {
  return {
    id: "request-1",
    projectId: "project-1",
    originalText: "Add dashboard and export.",
    status: "NEW",
    createdAt: new Date(),
    updatedAt: new Date(),
    analyzedAgainstBaseline: {
      id: "baseline-1",
      version: 4,
      status: "APPROVED",
    },
    items: [
      {
        id: "item-1",
        clientRequestId: "request-1",
        position: 1,
        text: "Add dashboard.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "item-2",
        clientRequestId: "request-1",
        position: 2,
        text: "Add export.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "item-3",
        clientRequestId: "request-1",
        position: 3,
        text: "Add filters.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    project: {
      id: "project-1",
      name: "Test project",
      value: 10000,
      client: { name: "Test client" },
    },
  };
}

describe("analyzeClientRequestItemsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientRequest.mockResolvedValue(createRequest());
    getRequestAnalysisRuns.mockResolvedValue([]);
  });

  it("starts eligible item analyses concurrently", async () => {
    let active = 0;
    let maxActive = 0;

    analyzeRequestScope.mockImplementation(
      async (itemId: string) => {
        active += 1;
        maxActive = Math.max(maxActive, active);

        await new Promise((resolve) =>
          setTimeout(resolve, 20),
        );

        active -= 1;

        return {
          id: `run-${itemId}`,
          status: "COMPLETED",
          scopeBaselineId: "baseline-1",
          scopeBaselineVersion: 4,
          result: {
            type: "SCOPE_COMPARISON",
            itemId,
          },
        };
      },
    );

    const result =
      await analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: ["item-1", "item-2", "item-3"],
      });

    expect(maxActive).toBe(3);
    expect(analyzeRequestScope).toHaveBeenCalledTimes(3);
    expect(result.results).toHaveLength(3);
    expect(
      result.results.every(
        (entry) => entry.status === "COMPLETED",
      ),
    ).toBe(true);
  });

  it("isolates a failed item from successful analyses", async () => {
    analyzeRequestScope.mockImplementation(
      async (itemId: string) => {
        if (itemId === "item-2") {
          throw new Error("Gemini failed.");
        }

        return {
          id: `run-${itemId}`,
          status: "COMPLETED",
          scopeBaselineId: "baseline-1",
          scopeBaselineVersion: 4,
          result: {
            type: "SCOPE_COMPARISON",
            itemId,
          },
        };
      },
    );

    const result =
      await analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: ["item-1", "item-2", "item-3"],
      });

    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemId: "item-1",
          status: "COMPLETED",
        }),
        expect.objectContaining({
          itemId: "item-2",
          status: "FAILED",
          error: "Gemini failed.",
        }),
        expect.objectContaining({
          itemId: "item-3",
          status: "COMPLETED",
        }),
      ]),
    );
  });

  it("does not start an item whose latest run is already running", async () => {
    getRequestAnalysisRuns.mockImplementation(
      async (itemId: string) =>
        itemId === "item-2"
          ? [
              {
                id: "running-run",
                status: "RUNNING",
                resultSnapshot: null,
              },
            ]
          : [],
    );

    analyzeRequestScope.mockResolvedValue({
      id: "run-item-1",
      status: "COMPLETED",
      scopeBaselineId: "baseline-1",
      scopeBaselineVersion: 4,
      result: {
        type: "SCOPE_COMPARISON",
        itemId: "item-1",
      },
    });

    const result =
      await analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: ["item-1", "item-2"],
      });

    expect(analyzeRequestScope).toHaveBeenCalledTimes(1);
    expect(analyzeRequestScope).toHaveBeenCalledWith(
      "item-1",
    );
    expect(result.results).toEqual(
      expect.arrayContaining([
        {
          itemId: "item-2",
          status: "SKIPPED_RUNNING",
        },
      ]),
    );
  });

  it("returns an existing completed result without starting another run", async () => {
    getRequestAnalysisRuns.mockImplementation(
      async (itemId: string) =>
        itemId === "item-1"
          ? [
              {
                id: "completed-run",
                status: "COMPLETED",
                resultSnapshot: {
                  type: "SCOPE_COMPARISON",
                  itemId: "item-1",
                },
              },
            ]
          : [],
    );

    analyzeRequestScope.mockResolvedValue({
      id: "run-item-2",
      status: "COMPLETED",
      scopeBaselineId: "baseline-1",
      scopeBaselineVersion: 4,
      result: {
        type: "SCOPE_COMPARISON",
        itemId: "item-2",
      },
    });

    const result =
      await analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: ["item-1", "item-2"],
      });

    expect(analyzeRequestScope).toHaveBeenCalledTimes(1);
    expect(analyzeRequestScope).toHaveBeenCalledWith(
      "item-2",
    );
    expect(result.results).toEqual(
      expect.arrayContaining([
        {
          itemId: "item-1",
          status: "SKIPPED_COMPLETED",
          runId: "completed-run",
          result: {
            type: "SCOPE_COMPARISON",
            itemId: "item-1",
          },
        },
      ]),
    );
  });

  it("rejects an item that does not belong to the request", async () => {
    await expect(
      analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: ["not-an-item"],
      }),
    ).rejects.toThrow(
      "does not belong to this request",
    );

    expect(analyzeRequestScope).not.toHaveBeenCalled();
  });

  it("rejects an empty item list", async () => {
    await expect(
      analyzeClientRequestItemsAction({
        projectId: "project-1",
        requestId: "request-1",
        itemIds: [],
      }),
    ).rejects.toThrow(
      "At least one client request item is required.",
    );
  });
});
