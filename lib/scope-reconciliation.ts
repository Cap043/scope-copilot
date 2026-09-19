import { randomUUID } from "node:crypto";

import type {
  ExtractedScope,
  NormalizedScope,
} from "@/lib/scope-schema";
import type {
  ScopeDiff,
  ScopeDiffEntry,
} from "@/lib/scope-diff";

export type ReconciledItemRelation =
  | "MATCHED"
  | "ADDED";

export type ReconciledScopeItem<
  CandidateItem,
> = CandidateItem & {
  /**
   * Stable application-owned identity.
   *
   * MATCHED -> existing base item ID
   * ADDED   -> newly generated application ID
   */
  id: string;

  /**
   * The old scope identity when this candidate item matched
   * an existing item.
   */
  baseItemId: string | null;

  /**
   * Indicates whether this item was carried across an existing
   * logical identity or created as a brand-new scope item.
   */
  relation: ReconciledItemRelation;
};

export type ReconciledScope = {
  deliverables: Array<
    ReconciledScopeItem<
      ExtractedScope["deliverables"][number]
    >
  >;

  features: Array<
    ReconciledScopeItem<
      ExtractedScope["features"][number]
    >
  >;

  exclusions: Array<
    ReconciledScopeItem<
      ExtractedScope["exclusions"][number]
    >
  >;

  clientResponsibilities: Array<
    ReconciledScopeItem<
      ExtractedScope["clientResponsibilities"][number]
    >
  >;

  revisionLimits: Array<
    ReconciledScopeItem<
      ExtractedScope["revisionLimits"][number]
    >
  >;

  timeline: ExtractedScope["timeline"];

  assumptions: Array<
    ReconciledScopeItem<
      ExtractedScope["assumptions"][number]
    >
  >;
};

export type ReconciliationSection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities"
  | "revisionLimits"
  | "assumptions";

type ReconciliationDiffEntry =
  | ScopeDiff["deliverables"][number]
  | ScopeDiff["features"][number]
  | ScopeDiff["exclusions"][number]
  | ScopeDiff["clientResponsibilities"][number]
  | ScopeDiff["revisionLimits"][number]
  | ScopeDiff["assumptions"][number];

export type ReconciliationUnresolvedEntry = {
  section: ReconciliationSection;
  entry: ReconciliationDiffEntry;
  reason: "MISSING_ACTIVE_ITEM" | "REMOVED_ITEM_REAPPEARED";
};

export type ScopeIdentityReconciliation = {
  scope: ReconciledScope;

  /**
   * Items that still require a human/product decision before
   * the candidate can become a real normalized baseline.
   */
  unresolved: ReconciliationUnresolvedEntry[];
};

/**
 * Assign an application-owned identity to one candidate item.
 *
 * Existing logical items reuse their approved-baseline ID.
 * Truly new items receive a new application-generated ID.
 *
 * Gemini never participates in this step.
 */
function reconcileCandidateItem<
  CandidateItem,
  BaseItem extends {
    id: string;
  },
>(
  entry: ScopeDiffEntry<
    BaseItem,
    CandidateItem
  >,
  createId: () => string,
): ReconciledScopeItem<CandidateItem> {
  if (!entry.candidateItem) {
    throw new Error(
      "Cannot reconcile a diff entry without a candidate item.",
    );
  }

  if (
    entry.status === "UNCHANGED" ||
    entry.status === "MODIFIED"
  ) {
    if (!entry.baseItemId) {
      throw new Error(
        "Matched scope items must have a base item ID.",
      );
    }

    return {
      ...entry.candidateItem,
      id: entry.baseItemId,
      baseItemId: entry.baseItemId,
      relation: "MATCHED",
    };
  }

  if (entry.status === "ADDED") {
    return {
      ...entry.candidateItem,
      id: createId(),
      baseItemId: null,
      relation: "ADDED",
    };
  }

  throw new Error(
    `Cannot assign identity to ${entry.status} scope entry.`,
  );
}

/**
 * Convert one diff section into identity-resolved candidate items.
 *
 * MISSING and CONFLICT entries are intentionally not materialized yet.
 * They remain unresolved because later reconciliation must decide what
 * should happen to the old scope item.
 */
function reconcileSection<
  CandidateItem,
  BaseItem extends {
    id: string;
  },
>(
  entries: Array<
    ScopeDiffEntry<BaseItem, CandidateItem>
  >,
  section:
    | "deliverables"
    | "features"
    | "exclusions"
    | "clientResponsibilities"
    | "revisionLimits"
    | "assumptions",
  createId: () => string,
) {
  const items: Array<
    ReconciledScopeItem<CandidateItem>
  > = [];

  const unresolved: ReconciliationUnresolvedEntry[] =
    [];

  for (const entry of entries) {
    if (
      entry.status === "UNCHANGED" ||
      entry.status === "MODIFIED" ||
      entry.status === "ADDED"
    ) {
      items.push(
        reconcileCandidateItem(
          entry,
          createId,
        ),
      );

      continue;
    }

    if (
      entry.status === "MISSING"
    ) {
      if (!entry.baseItem) {
        throw new Error(
          "Missing scope items must have a base item.",
        );
      }

      unresolved.push({
  section,
  entry: entry as unknown as ReconciliationUnresolvedEntry["entry"],
  reason: "MISSING_ACTIVE_ITEM",
});

      continue;
    }

    if (
      entry.status === "CONFLICT"
    ) {
      if (
        !entry.baseItem ||
        !entry.candidateItem
      ) {
        throw new Error(
          "Scope conflicts must have both base and candidate items.",
        );
      }

      unresolved.push({
  section,
  entry: entry as unknown as ReconciliationUnresolvedEntry["entry"],
  reason: "REMOVED_ITEM_REAPPEARED",
});
      continue;
    }

    throw new Error(
      `Unsupported scope diff status: ${entry.status}`,
    );
  }

  return {
    items,
    unresolved,
  };
}

/**
 * Resolve logical identities across an entire candidate scope.
 *
 * This is deliberately NOT the final persisted NormalizedScope:
 *
 * - missing items still need a human decision
 * - conflicts still need explicit resolution
 * - manual-amendment carry-over is handled later
 *
 * The result is therefore a reconciliation-ready candidate.
 */
export function reconcileScopeIdentities(
  baseScope: NormalizedScope,
  candidateScope: ExtractedScope,
  diff: ScopeDiff,
  createId: () => string = randomUUID,
): ScopeIdentityReconciliation {
  // `baseScope` is intentionally accepted here even though the current
  // implementation relies on the diff for identity mapping. Keeping the
  // dependency explicit makes this function's contract clear and allows
  // stronger consistency checks later without changing the API.
  void baseScope;
  void candidateScope;

  const deliverables =
    reconcileSection(
      diff.deliverables,
      "deliverables",
      createId,
    );

  const features =
    reconcileSection(
      diff.features,
      "features",
      createId,
    );

  const exclusions =
    reconcileSection(
      diff.exclusions,
      "exclusions",
      createId,
    );

  const clientResponsibilities =
    reconcileSection(
      diff.clientResponsibilities,
      "clientResponsibilities",
      createId,
    );

  const revisionLimits =
    reconcileSection(
      diff.revisionLimits,
      "revisionLimits",
      createId,
    );

  const assumptions =
    reconcileSection(
      diff.assumptions,
      "assumptions",
      createId,
    );

  return {
    scope: {
      deliverables:
        deliverables.items,
      features:
        features.items,
      exclusions:
        exclusions.items,
      clientResponsibilities:
        clientResponsibilities.items,
      revisionLimits:
        revisionLimits.items,
      timeline:
        candidateScope.timeline,
      assumptions:
        assumptions.items,
    },

    unresolved: [
      ...deliverables.unresolved,
      ...features.unresolved,
      ...exclusions.unresolved,
      ...clientResponsibilities.unresolved,
      ...revisionLimits.unresolved,
      ...assumptions.unresolved,
    ],
  };
}