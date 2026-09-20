"use server";

import {
  finalizeScopeRevisionCandidate,
} from "@/lib/scope-revision";

import {
  saveScopeRevisionDecision,
} from "@/lib/scope-revision-review";

import type {
  RevisionReviewDecision,
} from "@/lib/scope-revision-review-state";

/**
 * Persist one reviewer decision.
 *
 * The decision is written to the durable review audit trail immediately.
 */
export async function saveScopeRevisionDecisionAction(
  data: {
    candidateId: string;
    itemId: string;
    decision: RevisionReviewDecision;
  },
) {
  return saveScopeRevisionDecision(data);
}

/**
 * Finalize the review using the decisions already persisted in PostgreSQL.
 *
 * The browser no longer sends reviewer decisions here.
 */
export async function finalizeScopeRevisionAction(
  data: {
    candidateId: string;
  },
) {
  const result =
    await finalizeScopeRevisionCandidate(data);

  return {
    baselineId: result.baselineId,
    projectId: result.projectId,
    version: result.version,
    status: result.status,
  };
}