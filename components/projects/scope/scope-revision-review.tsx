"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  FilePlus,
  Minus,
  RefreshCw,
} from "lucide-react";

import { finalizeScopeRevisionAction } from "@/app/(dashboard)/projects/[projectId]/scope/update/actions";
import { Button } from "@/components/ui/button";

import type { ScopeRevisionReview } from "@/lib/scope-revision-review";
import type { ReconciliationUnresolvedEntry } from "@/lib/scope-reconciliation";

type Props = {
  review: ScopeRevisionReview;
};

type RevisionDiffEntry =
  | ScopeRevisionReview["diff"]["deliverables"][number]
  | ScopeRevisionReview["diff"]["features"][number]
  | ScopeRevisionReview["diff"]["exclusions"][number]
  | ScopeRevisionReview["diff"]["clientResponsibilities"][number]
  | ScopeRevisionReview["diff"]["revisionLimits"][number]
  | ScopeRevisionReview["diff"]["assumptions"][number];

type Decision = "CARRY_OVER" | "REMOVE";

const SECTION_LABELS = {
  deliverables: "Deliverables",
  features: "Features",
  exclusions: "Exclusions",
  clientResponsibilities: "Client Responsibilities",
  revisionLimits: "Revision Limits",
  assumptions: "Assumptions",
} as const;

/**
 * Convert any scope item into a human-readable label.
 *
 * Different sections have different shapes:
 * - standard items -> title
 * - revision limits -> type + limit
 * - assumptions -> statement
 */
function itemLabel(item: unknown) {
  if (
    typeof item !== "object" ||
    item === null
  ) {
    return "Scope item";
  }

  const record =
    item as Record<string, unknown>;

  if (typeof record.title === "string") {
    return record.title;
  }

  if (
    typeof record.type === "string" &&
    typeof record.limit === "string"
  ) {
    return `${record.type}: ${record.limit}`;
  }

  if (typeof record.statement === "string") {
    return record.statement;
  }

  return "Scope item";
}

function statusClasses(status: string) {
  switch (status) {
    case "CONFLICT":
      return "bg-destructive/10 text-destructive";

    case "ADDED":
    case "MODIFIED":
    case "MISSING":
      return "bg-muted text-foreground";

    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * One changed scope entry.
 *
 * Missing manual amendments expose an explicit carry-over/remove decision.
 * Reappeared removed items remain blocked as conflicts.
 */
function ChangeCard({
  entry,
  decision,
  onDecision,
}: {
  entry: RevisionDiffEntry;
  decision?: Decision;
  onDecision?: (decision: Decision) => void;
}) {
  const isManualMissing =
    entry.status === "MISSING" &&
    entry.baseItem?.provenance.type ===
      "manual_amendment";

  const isConflict =
    entry.status === "CONFLICT";

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses(
                entry.status,
              )}`}
            >
              {entry.status}
            </span>

            {entry.matchMethod && (
              <span className="text-xs text-muted-foreground">
                {entry.matchMethod}
              </span>
            )}
          </div>

          <div className="mt-3 space-y-1">
            {entry.baseItem && (
              <p className="text-sm font-medium">
                Previous:{" "}
                {itemLabel(entry.baseItem)}
              </p>
            )}

            {entry.candidateItem && (
              <p className="text-sm text-muted-foreground">
                Proposed:{" "}
                {itemLabel(entry.candidateItem)}
              </p>
            )}
          </div>
        </div>
      </div>

      {entry.status === "MODIFIED" &&
        entry.baseItem &&
        entry.candidateItem && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Current scope
              </p>

              <p className="mt-1 text-sm">
                {itemLabel(entry.baseItem)}
              </p>
            </div>

            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Proposed scope
              </p>

              <p className="mt-1 text-sm">
                {itemLabel(entry.candidateItem)}
              </p>
            </div>
          </div>
        )}

      {isManualMissing &&
        onDecision && (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">
              This was a manual scope amendment.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The new SOW does not mention it.
              Choose explicitly whether to keep
              the amendment in the new scope.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  decision === "CARRY_OVER"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  onDecision("CARRY_OVER")
                }
              >
                <Check />
                Carry over
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  decision === "REMOVE"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  onDecision("REMOVE")
                }
              >
                <Minus />
                Remove
              </Button>
            </div>
          </div>
        )}

      {isConflict && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

            <div>
              <p className="text-sm font-medium">
                Previously removed item reappeared
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                This cannot be resurrected
                automatically. It requires explicit
                reconciliation before a new scope
                version can be created.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScopeRevisionReview({
  review,
}: Props) {
  const router = useRouter();

  const [decisions, setDecisions] =
    useState<Record<string, Decision>>({});

  const [finalizing, setFinalizing] =
    useState(false);

  const [finalizeError, setFinalizeError] =
    useState("");

  const allChanges = useMemo(() => {
    const sections = [
      "deliverables",
      "features",
      "exclusions",
      "clientResponsibilities",
      "revisionLimits",
      "assumptions",
    ] as const;

    return sections.flatMap((section) =>
      review.diff[section].map((entry) => ({
        section,
        entry,
      })),
    );
  }, [review.diff]);

  const changedEntries =
    allChanges.filter(
      ({ entry }) =>
        entry.status !== "UNCHANGED",
    );

  /**
   * Only decisions that actually block materialization
   * count as unresolved for the finalization button.
   *
   * Document-derived items missing from the revised SOW
   * are allowed to disappear deterministically.
   */
  const unresolvedCount =
    review.unresolved.filter((entry) => {
      if (
        entry.reason ===
        "REMOVED_ITEM_REAPPEARED"
      ) {
        return true;
      }

      if (
        entry.reason ===
          "MISSING_ACTIVE_ITEM" &&
        entry.entry.baseItem?.provenance.type ===
          "manual_amendment"
      ) {
        const itemId =
          entry.entry.baseItemId;

        return (
          !itemId ||
          !decisions[itemId]
        );
      }

      return false;
    }).length;

  const selectedDecisionCount =
    Object.keys(decisions).length;

  async function handleFinalize() {
    if (
      unresolvedCount > 0 ||
      finalizing
    ) {
      return;
    }

    setFinalizing(true);
    setFinalizeError("");

    try {
      const result =
        await finalizeScopeRevisionAction({
          candidateId:
            review.candidate.id,
          decisions,
        });

      router.push(
        `/projects/${result.projectId}`,
      );
      router.refresh();
    } catch (error) {
      setFinalizeError(
        error instanceof Error
          ? error.message
          : "We couldn't create the new scope version.",
      );

      setFinalizing(false);
    }
  }

  function handleDecision(
    itemId: string,
    decision: Decision,
  ) {
    setDecisions((previous) => ({
      ...previous,
      [itemId]: decision,
    }));

    setFinalizeError("");
  }

  return (
    <div className="space-y-8">
      {/* Review summary */}
      <div className="rounded-xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="size-5" />

              <h2 className="text-lg font-semibold">
                Review SOW update
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Current approved scope: v
              {review.baseBaseline.version}
            </p>
          </div>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {review.candidate.status}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={
              <FilePlus className="size-4" />
            }
            label="Changes"
            value={changedEntries.length}
          />

          <SummaryCard
            icon={
              <AlertTriangle className="size-4" />
            }
            label="Unresolved"
            value={unresolvedCount}
          />

          <SummaryCard
            icon={
              <Check className="size-4" />
            }
            label="Decisions"
            value={selectedDecisionCount}
          />
        </div>
      </div>

      {/* Explain why manual decisions are required */}
      {review.carryOverRequests.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">
            Manual amendments
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            These additions were accepted after the
            original SOW. The revised SOW omitted them,
            so they require an explicit decision.
          </p>
        </section>
      )}

      {/* Changed scope by section */}
      {(
        [
          "deliverables",
          "features",
          "exclusions",
          "clientResponsibilities",
          "revisionLimits",
          "assumptions",
        ] as const
      ).map((section) => {
        const entries =
          review.diff[section].filter(
            (entry) =>
              entry.status !== "UNCHANGED",
          );

        if (entries.length === 0) {
          return null;
        }

        return (
          <section key={section}>
            <h3 className="text-sm font-semibold">
              {SECTION_LABELS[section]}
            </h3>

            <div className="mt-3 space-y-3">
              {entries.map(
                (entry, index) => (
                  <ChangeCard
                    key={`${section}-${index}`}
                    entry={entry}
                    decision={
                      entry.baseItemId
                        ? decisions[
                            entry.baseItemId
                          ]
                        : undefined
                    }
                    onDecision={
                      entry.status ===
                        "MISSING" &&
                      entry.baseItem
                        ?.provenance.type ===
                        "manual_amendment" &&
                      entry.baseItemId
                        ? (decision) =>
                            handleDecision(
                              entry.baseItemId!,
                              decision,
                            )
                        : undefined
                    }
                  />
                ),
              )}
            </div>
          </section>
        );
      })}

      {changedEntries.length === 0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No scope changes were detected.
        </div>
      )}

      {/* Final reconciliation state and materialization action */}
      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {unresolvedCount === 0 ? (
              <Check className="size-5" />
            ) : (
              <AlertTriangle className="size-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Reconciliation status
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {unresolvedCount === 0
                ? "All required reconciliation decisions are complete."
                : `${unresolvedCount} change(s) still require explicit reconciliation.`}
            </p>

            {unresolvedCount > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                The new draft version cannot be created
                until every blocking change is resolved.
              </p>
            )}

            {finalizeError && (
              <p className="mt-3 text-sm text-destructive">
                {finalizeError}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={handleFinalize}
                disabled={
                  unresolvedCount > 0 ||
                  finalizing
                }
              >
                <Check />
                {finalizing
                  ? "Creating draft version..."
                  : `Create version ${
                      review.baseBaseline.version + 1
                    } draft`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}