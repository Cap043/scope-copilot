 "use server";

import { revalidatePath } from "next/cache";

import {
  createClientRequest,
  saveClientRequestItems,
  getClientRequest,
} from "@/lib/requests";

import { decomposeClientRequestText } from "@/lib/ai/request/decompose";

/**
 * Server-side transport for request capture.
 */
export async function createClientRequestAction(data: {
  projectId: string;
  originalText: string;
}) {
  const request = await createClientRequest(data);

  revalidatePath(
    `/projects/${data.projectId}/requests`,
  );

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

/**
 * Ask Gemini to break the immutable original client message into
 * independently analyzable asks.
 *
 * Nothing is persisted by this action.
 */
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

/**
 * Persist the human-reviewed atomic request items.
 *
 * The saved items are returned directly to the client so the
 * current analysis workspace can transition without refreshing
 * the entire Server Component tree.
 */
export async function saveClientRequestItemsAction(data: {
  projectId: string;
  requestId: string;
  items: string[];
}) {
  const items = await saveClientRequestItems({
    clientRequestId: data.requestId,
    items: data.items,
  });

  // Keep future server renders and the request list fresh.
  // The current client workspace does not need router.refresh().
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