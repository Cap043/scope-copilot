import type { NormalizedScope } from "@/lib/scope-schema";
import {
  type ReconciliationUnresolvedEntry,
  type ReconciledScope,
  reconcileScopeIdentities,
} from "@/lib/scope-reconciliation";

export type ManualCarryOverDecision = "CARRY_OVER" | "REMOVE";

export type ManualCarryOverRequest = {
  itemId: string;
  section: ReconciliationUnresolvedEntry["section"];
  label: string;
  rationale: string;
  referenceId: string;
};

type PersistedScopeItem =
  | NormalizedScope["deliverables"][number]
  | NormalizedScope["features"][number]
  | NormalizedScope["exclusions"][number]
  | NormalizedScope["clientResponsibilities"][number]
  | NormalizedScope["revisionLimits"][number]
  | NormalizedScope["assumptions"][number];

export type CarriedOverScopeItem = {
  section: ReconciliationUnresolvedEntry["section"];
  item: PersistedScopeItem;
  relation: "CARRIED_OVER";
};

export type ScopeCarryOverResult = {
  scope: ReconciledScope;
  carriedOver: CarriedOverScopeItem[];
  unresolved: ReconciliationUnresolvedEntry[];
};

/**
 * Return only the unresolved manual amendments that require
 * an explicit carry-over/remove decision from the agency.
 */
export function getManualCarryOverRequests(
  reconciliation: ReturnType<typeof reconcileScopeIdentities>,
): ManualCarryOverRequest[] {
  return reconciliation.unresolved.flatMap((unresolved) => {
    if (unresolved.reason !== "MISSING_ACTIVE_ITEM") {
      return [];
    }

    const baseItem =
      unresolved.entry.baseItem as PersistedScopeItem | null;

    if (!baseItem) {
      return [];
    }

    if (
      baseItem.provenance.type !==
      "manual_amendment"
    ) {
      return [];
    }

    let label = "Scope item";

    if ("title" in baseItem) {
      label = baseItem.title;
    } else if ("type" in baseItem && "limit" in baseItem) {
      label = `${baseItem.type}: ${baseItem.limit}`;
    } else if ("statement" in baseItem) {
      label = baseItem.statement;
    }

    return [
      {
        itemId: baseItem.id,
        section: unresolved.section,
        label,
        rationale:
          baseItem.provenance.rationale,
        referenceId:
          baseItem.provenance.referenceId,
      },
    ];
  });
}

/**
 * Apply explicit decisions to unresolved manual amendments.
 *
 * Carry-over keeps the original persisted item intact, including
 * its stable ID and manual provenance. Remove simply resolves the
 * decision without resurrecting or rewriting anything.
 *
 * Other unresolved entries remain unresolved for later reconciliation.
 */
export function applyManualCarryOverDecisions(
  reconciliation: ReturnType<typeof reconcileScopeIdentities>,
  decisions: Readonly<
    Record<string, ManualCarryOverDecision>
  >,
): ScopeCarryOverResult {
  const requests =
    getManualCarryOverRequests(reconciliation);

  const eligibleIds = new Set(
    requests.map((request) => request.itemId),
  );

  for (const itemId of Object.keys(decisions)) {
    if (!eligibleIds.has(itemId)) {
      throw new Error(
        `Invalid manual carry-over decision for scope item "${itemId}".`,
      );
    }
  }

  const carriedOver: CarriedOverScopeItem[] = [];
  const unresolved: ReconciliationUnresolvedEntry[] = [];

  for (const entry of reconciliation.unresolved) {
    const baseItem =
      entry.entry.baseItem as PersistedScopeItem | null;

    const isMissingManualAmendment =
      entry.reason === "MISSING_ACTIVE_ITEM" &&
      baseItem?.provenance.type ===
        "manual_amendment";

    if (!isMissingManualAmendment || !baseItem) {
      unresolved.push(entry);
      continue;
    }

    const decision = decisions[baseItem.id];

    // No decision yet: keep the item unresolved.
    if (!decision) {
      unresolved.push(entry);
      continue;
    }

    if (decision === "CARRY_OVER") {
      carriedOver.push({
        section: entry.section,
        item: baseItem,
        relation: "CARRIED_OVER",
      });
    }

    // REMOVE intentionally produces no new item.
  }

  return {
    scope: reconciliation.scope,
    carriedOver,
    unresolved,
  };
}