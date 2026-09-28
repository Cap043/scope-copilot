"use server";

import { revalidatePath } from "next/cache";

import {
  createClientRequest,
  getClientRequest,
  saveClientRequestItems,
} from "@/lib/requests";
import { decomposeClientRequestText } from "@/lib/ai/request/decompose";
import { analyzeRequestScope } from "@/lib/ai/request/analyze-scope";
import { getRequestAnalysisRuns } from "@/lib/request-analysis";

export async function createClientRequestAction(data: {
  projectId: string;
  originalText: string;
}) {
  const request = await createClientRequest(data);

  revalidatePath(`/projects/${data.projectId}/requests`);
  revalidatePath(
    `/projects/${data.projectId}/requests/${request.id}`,
  );

  return {
    id: request.id,
    projectId: request.projectId,
    analyzedAgainstBaselineId:
      request.analyzedAgainstBaselineId,
    baselineVersion: request.baselineVersion,
    status: request.status,
  };
}

export async function decomposeClientRequestAction(data: {
  projectId: string;
  requestId: string;
}) {
  const request = await getClientRequest(
    data.projectId,
    data.requestId,
  );

  if (!request) {
    throw new Error("Client request not found.");
  }

  if (request.items.length > 0) {
    throw new Error(
      "Atomic request items already exist for this case file.",
    );
  }

  return decomposeClientRequestText(
    request.originalText,
  );
}

export async function saveClientRequestItemsAction(data: {
  projectId: string;
  requestId: string;
  items: string[];
}) {
  const items = await saveClientRequestItems({
    clientRequestId: data.requestId,
    items: data.items,
  });

  revalidatePath(
    `/projects/${data.projectId}/requests/${data.requestId}`,
  );

  revalidatePath(
    `/projects/${data.projectId}/requests`,
  );

  return {
    items: items.map((item) => ({
      id: item.id,
      position: item.position,
      text: item.text,
    })),
  };
}

export async function analyzeClientRequestItemAction(data: {
  projectId: string;
  requestId: string;
  itemId: string;
}) {
  const request = await getClientRequest(
    data.projectId,
    data.requestId,
  );

  if (!request) {
    throw new Error("Client request not found.");
  }

  const item = request.items.find(
    (requestItem) =>
      requestItem.id === data.itemId,
  );

  if (!item) {
    throw new Error(
      "Client request item not found.",
    );
  }

  const result =
    await analyzeRequestScope(item.id);

  revalidatePath(
    `/projects/${data.projectId}/requests/${data.requestId}`,
  );

  return result;
}

export type BatchRequestAnalysisResult =
  | {
      itemId: string;
      status: "COMPLETED";
      runId: string;
      result: unknown;
    }
  | {
      itemId: string;
      status: "FAILED";
      error: string;
    }
  | {
      itemId: string;
      status: "SKIPPED_RUNNING";
    }
  | {
      itemId: string;
      status: "SKIPPED_COMPLETED";
      runId: string;
      result: unknown;
    };

/**
 * Analyze multiple confirmed atomic asks concurrently.
 *
 * The request itself is authorized first, every supplied item ID is checked
 * against that request, and already-running/completed items are not started
 * again. Failed items remain retryable. Promise.allSettled isolates failures
 * so one AI failure never cancels the other analyses.
 */
export async function analyzeClientRequestItemsAction(data: {
  projectId: string;
  requestId: string;
  itemIds: string[];
}) {
  const request = await getClientRequest(
    data.projectId,
    data.requestId,
  );

  if (!request) {
    throw new Error("Client request not found.");
  }

  const uniqueItemIds = [
    ...new Set(data.itemIds.map((itemId) => itemId.trim())),
  ].filter(Boolean);

  if (uniqueItemIds.length === 0) {
    throw new Error(
      "At least one client request item is required.",
    );
  }

  const requestItems = uniqueItemIds.map((itemId) => {
    const item = request.items.find(
      (requestItem) => requestItem.id === itemId,
    );

    if (!item) {
      throw new Error(
        `Client request item ${itemId} does not belong to this request.`,
      );
    }

    return item;
  });

  const prepared = await Promise.all(
    requestItems.map(async (item) => {
      const runs = await getRequestAnalysisRuns(item.id);
      const latestRun = runs[0];

      if (latestRun?.status === "RUNNING" || latestRun?.status === "PENDING") {
        return {
          itemId: item.id,
          action: "SKIPPED_RUNNING" as const,
        };
      }

      if (
        latestRun?.status === "COMPLETED" &&
        latestRun.resultSnapshot !== null
      ) {
        return {
          itemId: item.id,
          action: "SKIPPED_COMPLETED" as const,
          runId: latestRun.id,
          result: latestRun.resultSnapshot,
        };
      }

      return {
        itemId: item.id,
        action: "ANALYZE" as const,
      };
    }),
  );

  const analyses = prepared.filter(
    (entry) => entry.action === "ANALYZE",
  );

  const settled = await Promise.allSettled(
    analyses.map((entry) =>
      analyzeRequestScope(entry.itemId),
    ),
  );

  const results: BatchRequestAnalysisResult[] = [];

  for (const entry of prepared) {
    if (entry.action === "SKIPPED_RUNNING") {
      results.push({
        itemId: entry.itemId,
        status: "SKIPPED_RUNNING",
      });
      continue;
    }

    if (entry.action === "SKIPPED_COMPLETED") {
      results.push({
        itemId: entry.itemId,
        status: "SKIPPED_COMPLETED",
        runId: entry.runId,
        result: entry.result,
      });
    }
  }

  analyses.forEach((entry, index) => {
    const settledResult = settled[index];

    if (settledResult.status === "fulfilled") {
      results.push({
        itemId: entry.itemId,
        status: "COMPLETED",
        runId: settledResult.value.id,
        result: settledResult.value.result,
      });
      return;
    }

    results.push({
      itemId: entry.itemId,
      status: "FAILED",
      error:
        settledResult.reason instanceof Error
          ? settledResult.reason.message
          : "Scope analysis failed.",
    });
  });

  revalidatePath(
    `/projects/${data.projectId}/requests/${data.requestId}`,
  );

  return {
    results,
  };
}
