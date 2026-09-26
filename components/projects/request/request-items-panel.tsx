"use client";

import {
  Check,
  ChevronDown,
  LoaderCircle,
  ListChecks,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import {
  analyzeClientRequestItemAction,
  decomposeClientRequestAction,
  saveClientRequestItemsAction,
} from "@/app/(dashboard)/projects/[projectId]/requests/actions";

import type { ScopeRelationship } from "@/lib/ai/request/compare-scope";
import { ScopeRelationshipBadge } from "./scope-relationship-badge";

type ClientRequestItem = {
  id: string;
  position: number;
  text: string;
};

type AnalysisComparison = {
  scopeItemId: string;
  relationship: ScopeRelationship;
  explanation: string;
};

type AnalysisCandidate = {
  id: string;
  section:
    | "deliverables"
    | "features"
    | "exclusions"
    | "clientResponsibilities"
    | "revisionLimits"
    | "assumptions";
  title?: string;
  description?: string;
  type?: string;
  limit?: string;
  statement?: string;
  sourceReferences: Array<{
    quote: string;
    section?: string;
  }>;
  status: "active" | "removed";
};

type ScopeAnalysisResult = {
  type: "SCOPE_COMPARISON";

  retrieval: {
    version: string;
    candidateIds: string[];
  };

  candidates: AnalysisCandidate[];

  comparison: {
    version: string;
    overallRelationship: ScopeRelationship;
    comparisons: AnalysisComparison[];
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };

  scopeBaseline: {
    id: string;
    version: number;
  };
};

type InitialAnalysis = {
  itemId: string;
  run: {
    id: string;
    status: string;
    scopeBaselineId: string;
    scopeBaselineVersion: number;
    result: unknown;
  } | null;
};

type RequestItemsPanelProps = {
  scopeBaselineVersion: number;
  projectId: string;
  requestId: string;
  items: ClientRequestItem[];
  initialAnalyses: InitialAnalysis[];
};

type AnalysisState =
  | {
      status: "idle";
    }
  | {
      status: "running";
      startedAt: number;
    }
  | {
      status: "completed";
      result: ScopeAnalysisResult;
    }
  | {
      status: "error";
      message: string;
    };

function isScopeAnalysisResult(
  value: unknown,
): value is ScopeAnalysisResult {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const result =
    value as {
      type?: unknown;
      comparison?: unknown;
      candidates?: unknown;
      scopeBaseline?: unknown;
    };

  return (
    result.type === "SCOPE_COMPARISON" &&
    Array.isArray(result.candidates) &&
    !!result.comparison &&
    typeof result.comparison === "object" &&
    !!result.scopeBaseline &&
    typeof result.scopeBaseline === "object"
  );
}

function getInitialAnalysis(
  itemId: string,
  initialAnalyses: InitialAnalysis[],
): AnalysisState {
  const entry =
    initialAnalyses.find(
      (analysis) =>
        analysis.itemId === itemId,
    );

  if (
    entry?.run?.result &&
    isScopeAnalysisResult(
      entry.run.result,
    )
  ) {
    return {
      status: "completed",
      result: entry.run.result,
    };
  }

  return {
    status: "idle",
  };
}

export function RequestItemsPanel({
  projectId,
  requestId,
  items,
  scopeBaselineVersion,
  initialAnalyses,
}: RequestItemsPanelProps) {
  const [confirmedItems, setConfirmedItems] =
    useState<ClientRequestItem[]>(items);

  const [suggestedItems, setSuggestedItems] =
    useState<string[]>([]);

  const [isBreakingDown, setIsBreakingDown] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [activeItemId, setActiveItemId] =
    useState<string | null>(
      items[0]?.id ?? null,
    );

  const [analysisStates, setAnalysisStates] =
    useState<
      Record<string, AnalysisState>
    >(() => {
      return Object.fromEntries(
        items.map((item) => [
          item.id,
          getInitialAnalysis(
            item.id,
            initialAnalyses,
          ),
        ]),
      );
    });

  useEffect(() => {
    setConfirmedItems(items);

    setActiveItemId(
      (current) =>
        current &&
        items.some(
          (item) => item.id === current,
        )
          ? current
          : items[0]?.id ?? null,
    );

    setAnalysisStates(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          getInitialAnalysis(
            item.id,
            initialAnalyses,
          ),
        ]),
      ),
    );
  }, [items, initialAnalyses]);

  async function handleBreakdown() {
    setIsBreakingDown(true);
    setError(null);

    try {
      const result =
        await decomposeClientRequestAction({
          projectId,
          requestId,
        });

      setSuggestedItems(result.items);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the client request.",
      );
    } finally {
      setIsBreakingDown(false);
    }
  }

  async function handleSave() {
    const cleanedItems =
      suggestedItems
        .map((item) => item.trim())
        .filter(Boolean);

    if (cleanedItems.length === 0) {
      setError(
        "At least one atomic request item is required.",
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result =
        await saveClientRequestItemsAction({
          projectId,
          requestId,
          items: cleanedItems,
        });

      setConfirmedItems(result.items);
      setSuggestedItems([]);

      setActiveItemId(
        result.items[0]?.id ?? null,
      );

      setAnalysisStates(
        Object.fromEntries(
          result.items.map((item) => [
            item.id,
            {
              status: "idle",
            },
          ]),
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save atomic request items.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAnalyze(
    itemId: string,
  ) {
    setError(null);

    setAnalysisStates(
      (current) => ({
        ...current,
        [itemId]: {
          status: "running",
          startedAt: Date.now(),
        },
      }),
    );

    try {
      const result =
        await analyzeClientRequestItemAction({
          projectId,
          requestId,
          itemId,
        });

      if (
        !result.result ||
        !isScopeAnalysisResult(
          result.result,
        )
      ) {
        throw new Error(
          "Scope analysis returned an invalid result.",
        );
      }

      setAnalysisStates(
        (current) => ({
          ...current,
          [itemId]: {
            status: "completed",
            result: result.result,
          },
        }),
      );
    } catch (error) {
      setAnalysisStates(
        (current) => ({
          ...current,
          [itemId]: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to analyze this request.",
          },
        }),
      );
    }
  }

  function updateSuggestedItem(
    index: number,
    value: string,
  ) {
    setSuggestedItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? value
          : item,
      ),
    );
  }

  function removeSuggestedItem(
    index: number,
  ) {
    setSuggestedItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  function autoGrow(
    element: HTMLTextAreaElement,
  ) {
    element.style.height = "auto";
    element.style.height =
      `${element.scrollHeight}px`;
  }

  const hasSavedItems =
    confirmedItems.length > 0;

  const hasSuggestions =
    suggestedItems.length > 0;

  const activeAnalysis =
    activeItemId
      ? analysisStates[activeItemId]
      : undefined;

  const canProceedToImpact =
    activeAnalysis?.status ===
    "completed";

  return (
    <section>
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-ai/10">
              <ListChecks className="size-3.5 text-ai" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Decision queue
            </p>

            {hasSavedItems && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {confirmedItems.length}{" "}
                {confirmedItems.length === 1
                  ? "ask"
                  : "asks"}
              </span>
            )}
          </div>

          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
            Analyze each client ask
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each confirmed ask is evaluated independently against the exact
            approved scope pinned to this request.
          </p>
        </div>

        {hasSavedItems && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-success" />
            Breakdown confirmed
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
        </div>
      )}

      {isBreakingDown ? (
        <BreakdownLoadingState />
      ) : hasSavedItems ? (
        <div className="mt-5">
          <div className="divide-y divide-border/70 border-y border-border/70">
            {confirmedItems.map(
              (item) => {
                const isActive =
                  activeItemId === item.id;

                const analysis =
                  analysisStates[item.id] ??
                  ({
                    status: "idle",
                  } satisfies AnalysisState);

                return (
                  <DecisionQueueItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    analysis={analysis}
                    scopeBaselineVersion={
                      scopeBaselineVersion
                    }
                    onToggle={() =>
                      setActiveItemId(
                        isActive
                          ? null
                          : item.id,
                      )
                    }
                    onAnalyze={() =>
                      handleAnalyze(item.id)
                    }
                  />
                );
              },
            )}
          </div>

          <div className="sticky bottom-0 z-20 mt-4 border-t border-border/70 bg-background/95 px-1 py-3 backdrop-blur-md">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {activeItemId
                  ? canProceedToImpact
                    ? "This ask is ready for impact assessment."
                    : "Complete scope analysis for the active ask before moving it into impact assessment."
                  : "Select an ask to continue."}
              </p>

              <Button
                type="button"
                size="sm"
                disabled={
                  !canProceedToImpact
                }
              >
                Proceed to Impact Assessment
              </Button>
            </div>
          </div>
        </div>
      ) : hasSuggestions ? (
        <BreakdownReview
          suggestedItems={suggestedItems}
          isSaving={isSaving}
          updateSuggestedItem={
            updateSuggestedItem
          }
          removeSuggestedItem={
            removeSuggestedItem
          }
          autoGrow={autoGrow}
          onCancel={() => {
            setSuggestedItems([]);
            setError(null);
          }}
          onSave={handleSave}
        />
      ) : (
        <BreakdownReadyState
          onAnalyze={handleBreakdown}
        />
      )}
    </section>
  );
}

function DecisionQueueItem({
  item,
  isActive,
  analysis,
  scopeBaselineVersion,
  onToggle,
  onAnalyze,
}: {
  item: ClientRequestItem;
  isActive: boolean;
  analysis: AnalysisState;
  scopeBaselineVersion: number;
  onToggle: () => void;
  onAnalyze: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-start gap-3 py-4 text-left"
        onClick={onToggle}
        aria-expanded={isActive}
      >
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
          {item.position}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-relaxed">
            {item.text}
          </span>

          {analysis.status ===
            "completed" && (
            <span className="mt-2 block">
              <ScopeRelationshipBadge
                relationship={
                  analysis.result
                    .comparison
                    .overallRelationship
                }
                compact
              />
            </span>
          )}
        </span>

        <ChevronDown
          className={[
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            isActive
              ? "rotate-180"
              : "",
          ].join(" ")}
        />
      </button>

      {isActive && (
        <div className="pb-5 pl-10">
          {analysis.status ===
            "idle" && (
            <div className="rounded-lg bg-muted/50 px-4 py-4">
              <p className="text-sm font-medium">
                Ready for scope analysis
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Scope Copilot will retrieve potentially relevant items from the pinned approved baseline and then perform a deeper semantic comparison.
              </p>

              <Button
                type="button"
                size="sm"
                className="mt-4 bg-ai text-ai-foreground hover:bg-ai/90"
                onClick={onAnalyze}
              >
                <Sparkles className="size-3.5" />
                Analyze against approved scope
              </Button>
            </div>
          )}

          {analysis.status ===
            "running" && (
            <ScopeAnalysisLoadingState
              startedAt={
                analysis.startedAt
              }
              scopeBaselineVersion={
                scopeBaselineVersion
              }
            />
          )}

          {analysis.status ===
            "error" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-4">
              <p className="text-sm font-medium text-destructive">
                Scope analysis failed
              </p>

              <p className="mt-1 text-xs leading-relaxed text-destructive/80">
                {analysis.message}
              </p>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={onAnalyze}
              >
                Try again
              </Button>
            </div>
          )}

          {analysis.status ===
            "completed" && (
            <ScopeAnalysisResultView
              result={analysis.result}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ScopeAnalysisLoadingState({
  startedAt,
  scopeBaselineVersion,
}: {
  startedAt: number;
  scopeBaselineVersion: number;
}) {
  const [elapsed, setElapsed] =
    useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      setElapsed(
        Date.now() - startedAt,
      );
    };

    updateElapsed();

    const interval =
      window.setInterval(
        updateElapsed,
        250,
      );

    return () =>
      window.clearInterval(interval);
  }, [startedAt]);

  const message =
    elapsed < 2000
      ? "Scanning approved baseline..."
      : elapsed < 4000
        ? "Retrieving candidate scope items..."
        : "Running deep semantic comparison...";

  return (
    <div
      className="rounded-lg bg-muted/50 px-4 py-5"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ai/10">
          <LoaderCircle className="size-4 animate-spin text-ai" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Comparing this ask against Approved Scope v
            {scopeBaselineVersion}.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-2 w-5/6 animate-pulse rounded-full bg-muted" />
        <div className="h-2 w-3/5 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function ScopeAnalysisResultView({
  result,
}: {
  result: ScopeAnalysisResult;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Scope relationship
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ScopeRelationshipBadge
              relationship={
                result.comparison
                  .overallRelationship
              }
            />

            <span className="text-xs text-muted-foreground">
              {result.comparison.confidence.toLowerCase()} confidence
            </span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground">
          Approved Scope v
          {result.scopeBaseline.version}
        </span>
      </div>

      {result.comparison
        .comparisons.length === 0 ? (
        <div className="rounded-lg bg-muted/50 px-4 py-4">
          <p className="text-sm font-medium">
            No candidate scope items were retrieved.
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The retrieval engine did not identify an approved scope item requiring deeper comparison. This is a retrieval result, not by itself a determination that the request is out of scope.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Evidence reviewed
            </p>
          </div>

          {result.comparison.comparisons.map(
            (comparison) => {
              const candidate =
                result.candidates.find(
                  (item) =>
                    item.id ===
                    comparison.scopeItemId,
                );

              if (!candidate) {
                return null;
              }

              const title =
                candidate.title ??
                candidate.statement ??
                candidate.type ??
                "Approved scope item";

              return (
                <div
                  key={
                    comparison.scopeItemId
                  }
                  className="space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ScopeRelationshipBadge
                      relationship={
                        comparison.relationship
                      }
                      compact
                    />

                    <p className="text-sm font-semibold">
                      {title}
                    </p>
                  </div>

                  <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">
                    {comparison.explanation}
                  </p>

                  {candidate
                    .sourceReferences
                    .map(
                      (
                        reference,
                        index,
                      ) => (
                        <blockquote
                          key={`${comparison.scopeItemId}-${index}`}
                          className="border-l-2 border-primary/50 pl-3 text-sm italic leading-relaxed text-muted-foreground"
                        >
                          “{reference.quote}”
                        </blockquote>
                      ),
                    )}
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownLoadingState() {
  return (
    <div className="mt-5 rounded-lg bg-muted/50 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-ai/10">
          <LoaderCircle className="size-5 animate-spin text-ai" />
        </div>

        <p className="mt-3 text-sm font-semibold">
          Analyzing client request…
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Identifying the individual asks in the original client message.
        </p>

        <div className="mt-5 space-y-2">
          <div className="h-2 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-2 w-4/5 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-2 w-3/5 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function BreakdownReadyState({
  onAnalyze,
}: {
  onAnalyze: () => void;
}) {
  return (
    <div className="mt-5 rounded-lg bg-ai/5 px-6 py-9 sm:px-10 sm:py-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-ai/10">
          <Sparkles className="size-5 text-ai" />
        </div>

        <p className="mt-3 text-sm font-semibold">
          Ready to analyze the client request
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Scope Copilot will identify the separate asks from the original client message. You&apos;ll review the suggestions before anything is saved.
        </p>

        <Button
          type="button"
          size="sm"
          className="mt-5 bg-ai text-ai-foreground hover:bg-ai/90"
          onClick={onAnalyze}
        >
          <Sparkles className="size-3.5" />
          Analyze client request
        </Button>
      </div>
    </div>
  );
}

function BreakdownReview({
  suggestedItems,
  isSaving,
  updateSuggestedItem,
  removeSuggestedItem,
  autoGrow,
  onCancel,
  onSave,
}: {
  suggestedItems: string[];
  isSaving: boolean;
  updateSuggestedItem: (
    index: number,
    value: string,
  ) => void;
  removeSuggestedItem: (
    index: number,
  ) => void;
  autoGrow: (
    element: HTMLTextAreaElement,
  ) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5">
      <div className="rounded-lg bg-ai/5 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ai/10">
            <Sparkles className="size-4 text-ai" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">
                Review AI-generated breakdown
              </h3>

              <span className="rounded-full bg-ai/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-ai">
                AI suggestion
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Check each ask against the original client message. Edit or remove anything inaccurate before saving.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {suggestedItems.map(
          (item, index) => (
            <div
              key={`suggested-item-${index}`}
              className="flex items-start gap-2"
            >
              <span className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                {index + 1}
              </span>

              <textarea
                value={item}
                onChange={(event) =>
                  updateSuggestedItem(
                    index,
                    event.target.value,
                  )
                }
                onInput={(event) =>
                  autoGrow(
                    event.currentTarget,
                  )
                }
                rows={1}
                disabled={isSaving}
                aria-label={`Atomic request item ${index + 1}`}
                className="min-h-10 min-w-0 flex-1 resize-none overflow-hidden rounded-lg border bg-background px-3 py-2 text-sm leading-5 outline-none ring-offset-background placeholder:text-muted-foreground focus:border-ai focus:ring-2 focus:ring-ai/15 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() =>
                  removeSuggestedItem(
                    index,
                  )
                }
                disabled={isSaving}
                aria-label={`Remove item ${index + 1}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ),
        )}
      </div>

      <div className="sticky bottom-0 z-20 mt-5 border-t bg-background/95 px-1 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">
            AI suggestions aren&apos;t saved until you approve this breakdown.
          </p>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={
                isSaving ||
                suggestedItems.every(
                  (item) =>
                    !item.trim(),
                )
              }
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save{" "}
                  {suggestedItems.length ===
                  1
                    ? "atomic ask"
                    : "atomic asks"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}