"use server";

import { revalidatePath } from "next/cache";

import { createClientRequest } from "@/lib/requests";

/**
 * Server-side transport for request capture.
 *
 * The domain function performs authentication, tenant isolation, approved
 * baseline resolution, and persistence. This action only connects the UI to it.
 */
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