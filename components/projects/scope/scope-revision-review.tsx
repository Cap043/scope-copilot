"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  FilePlus,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ScopeRevisionReview,
} from "@/lib/scope-revision-review";
import type {
  ReconciliationUnresolvedEntry,
} from "@/lib/scope-reconciliation";

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
type Decision =
  | "CARRY_OVER"
  | "REMOVE";

const SECTION_LABELS = {
  deliverables: "Deliverables",
  features: "Features",
  exclusions: "Exclusions",
  clientResponsibilities:
    "Client Responsibilities",
  revisionLimits: "Revision Limits",
  assumptions: "Assumptions",
} as const;

function entryLabel(
  entry: ReconciliationUnresolvedEntry,
) {
  const baseItem =
    entry.entry.baseItem;

  if (!baseItem) {
    return "Scope item";
  }

  if ("title" in baseItem) {
    return baseItem.title;
  }

  if (
    "type" in baseItem &&
    "limit" in baseItem
  ) {
    return `${baseItem.type}: ${baseItem.limit}`;
  }

  if ("statement" in baseItem) {
    return baseItem.statement;
  }

  return "Scope item";
}

function candidateLabel(
  entry: ReconciliationUnresolvedEntry,
) {
  const candidateItem =
    entry.entry.candidateItem;

  if (!candidateItem) {
    return "Scope item";
  }

  if ("title" in candidateItem) {
    return candidateItem.title;
  }

  if (
    "type" in candidateItem &&
    "limit" in candidateItem
  ) {
    return `${candidateItem.type}: ${candidateItem.limit}`;
  }

  if ("statement" in candidateItem) {
    return candidateItem.statement;
  }

  return "Scope item";
}

function statusClasses(
  status: string,
) {
  switch (status) {
    case "ADDED":
      return "bg-muted text-foreground";
    case "MODIFIED":
      return "bg-muted text-foreground";
    case "MISSING":
      return "bg-muted text-foreground";
    case "CONFLICT":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ChangeCard({
  entry,
  decision,
  onDecision,
}: {
  entry: RevisionDiffEntry;
  decision?: Decision;
  onDecision?: (
    decision: Decision,
  ) => void;
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
        <div>
          <div className="flex items-center gap-2">
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

          <div className="mt-3">
            {entry.baseItem && (
              <p className="text-sm font-medium">
                Previous:{" "}
                {entryLabelForBase(
                  entry.baseItem,
                )}
              </p>
            )}

            {entry.candidateItem && (
              <p className="mt-1 text-sm text-muted-foreground">
                Proposed:{" "}
                {entryLabelForCandidate(
                  entry.candidateItem,
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {entry.status ===
        "MODIFIED" &&
        entry.baseItem &&
        entry.candidateItem && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Current scope
              </p>
              <p className="mt-1 text-sm">
                {entryLabelForBase(
                  entry.baseItem,
                )}
              </p>
            </div>

            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Proposed scope
              </p>
              <p className="mt-1 text-sm">
                {entryLabelForCandidate(
                  entry.candidateItem,
                )}
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
                  decision ===
                  "CARRY_OVER"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  onDecision(
                    "CARRY_OVER",
                  )
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
                  onDecision(
                    "REMOVE",
                  )
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
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />

            <div>
              <p className="text-sm font-medium">
                Previously removed item reappeared
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                This cannot be resurrected automatically.
                It requires explicit reconciliation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Keep these helpers local so the renderer works with the heterogeneous
 * diff entry types generated by each scope section.
 */
function entryLabelForBase(
  item: unknown,
) {
  if (
    typeof item !== "object" ||
    item === null
  ) {
    return "Scope item";
  }

  const record =
    item as Record<string, unknown>;

  if (
    typeof record.title === "string"
  ) {
    return record.title;
  }

  if (
    typeof record.type === "string" &&
    typeof record.limit === "string"
  ) {
    return `${record.type}: ${record.limit}`;
  }

  if (
    typeof record.statement ===
    "string"
  ) {
    return record.statement;
  }

  return "Scope item";
}

function entryLabelForCandidate(
  item: unknown,
) {
  if (
    typeof item !== "object" ||
    item === null
  ) {
    return "Scope item";
  }

  const record =
    item as Record<string, unknown>;

  if (
    typeof record.title === "string"
  ) {
    return record.title;
  }

  if (
    typeof record.type === "string" &&
    typeof record.limit === "string"
  ) {
    return `${record.type}: ${record.limit}`;
  }

  if (
    typeof record.statement ===
    "string"
  ) {
    return record.statement;
  }

  return "Scope item";
}

export function ScopeRevisionReview({
  review,
}: Props) {
  const [decisions, setDecisions] =
    useState<
      Record<string, Decision>
    >({});

  const allChanges = useMemo(() => {
    const sections = [
      "deliverables",
      "features",
      "exclusions",
      "clientResponsibilities",
      "revisionLimits",
      "assumptions",
    ] as const;

    return sections.flatMap(
      (section) =>
        review.diff[section].map(
          (entry) => ({
            section,
            entry,
          }),
        ),
    );
  }, [review.diff]);

  const changedEntries =
    allChanges.filter(
      ({ entry }) =>
        entry.status !==
        "UNCHANGED",
    );

  const unresolvedCount =
    review.unresolved.length;

  const selectedDecisionCount =
    Object.keys(decisions).length;

  return (
    <div className="space-y-8">
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
            icon={<FilePlus className="size-4" />}
            label="Changes"
            value={changedEntries.length}
          />

          <SummaryCard
            icon={<AlertTriangle className="size-4" />}
            label="Unresolved"
            value={unresolvedCount}
          />

          <SummaryCard
            icon={<Check className="size-4" />}
            label="Decisions"
            value={selectedDecisionCount}
          />
        </div>
      </div>

      {review.carryOverRequests.length >
        0 && (
        <section>
          <h3 className="text-sm font-semibold">
            Manual amendments
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            These additions were accepted after the original
            SOW. The new SOW omitted them, so they require an
            explicit decision.
          </p>
        </section>
      )}

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
              entry.status !==
              "UNCHANGED",
          );

        if (entries.length === 0) {
          return null;
        }

        return (
          <section
            key={section}
          >
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
                        ?.provenance
                        .type ===
                        "manual_amendment" &&
                      entry.baseItemId
                        ? (decision) =>
                            setDecisions(
                              (
                                previous,
                              ) => ({
                                ...previous,
                                [entry.baseItemId!]:
                                  decision,
                              }),
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

      {changedEntries.length ===
        0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No scope changes were detected.
        </div>
      )}

      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="text-sm font-medium">
          Reconciliation status
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {unresolvedCount === 0
            ? "All changes currently have a deterministic identity."
            : `${unresolvedCount} change(s) still require explicit reconciliation.`}
        </p>

        {unresolvedCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Final V2 materialization and approval remain
            unavailable until all unresolved changes are resolved.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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