export const REVISION_REVIEW_DECISIONS = [
  "CARRY_OVER",
  "REMOVE",
] as const;

export type RevisionReviewDecision =
  (typeof REVISION_REVIEW_DECISIONS)[number];

export type RevisionReviewDecisionRecord = {
  id: string;
  itemId: string;
  section: string;
  decision: RevisionReviewDecision;
  actorId: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
};

/**
 * Convert the append-only decision history into the current decision state.
 *
 * The database keeps every historical decision, but the review UI needs only
 * the latest decision for each scope item.
 *
 * Because history is ordered chronologically, later decisions overwrite
 * earlier decisions for the same item.
 */
export function buildCurrentRevisionDecisions(
  history: RevisionReviewDecisionRecord[],
): Record<
  string,
  RevisionReviewDecision
> {
  const decisions: Record<
    string,
    RevisionReviewDecision
  > = {};

  for (const record of history) {
    decisions[record.itemId] =
      record.decision;
  }

  return decisions;
}

/**
 * Runtime validation for values crossing a server/client boundary.
 */
export function isRevisionReviewDecision(
  value: unknown,
): value is RevisionReviewDecision {
  return (
    typeof value === "string" &&
    REVISION_REVIEW_DECISIONS.includes(
      value as RevisionReviewDecision,
    )
  );
}