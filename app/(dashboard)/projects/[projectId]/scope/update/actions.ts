"use server";

import { finalizeScopeRevisionCandidate } from "@/lib/scope-revision";

export async function finalizeScopeRevisionAction(data: {
  candidateId: string;
  decisions: Record<
    string,
    "CARRY_OVER" | "REMOVE"
  >;
}) {
  const result =
    await finalizeScopeRevisionCandidate(data);

  return {
    baselineId: result.baselineId,
    projectId: result.projectId,
    version: result.version,
    status: result.status,
  };
}