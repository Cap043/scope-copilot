"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  LoaderCircle,
  ListChecks,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import {
  analyzeClientRequestItemAction,
  analyzeClientRequestItemsAction,
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
    confidence?: "HIGH" | "MEDIUM" | "LOW";
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

function getRelationshipLabel(
  relationship: ScopeRelationship,
) {
  switch (relationship) {
    case "DIRECTLY_INCLUDED":
      return "Directly included";

    case "PARTIALLY_INCLUDED":
      return "Partially included";

    case "RELATED_NOT_INCLUDED":
      return "Related, not included";

    case "EXPLICITLY_EXCLUDED":
      return "Explicitly excluded";

    case "CONFLICTING":
      return "Conflicting";

    case "AMBIGUOUS":
      return "Ambiguous";

    case "UNRELATED":
      return "Unrelated";

    default:
      return "Unreviewed";
  }
}

function getItemStatus(
  analysis: AnalysisState,
): {
  label: string;
  tone:
    | "muted"
    | "success"
    | "warning"
    | "destructive"
    | "ai";
} {
  switch (analysis.status) {
    case "running":
      return {
        label: "Analyzing",
        tone: "ai",
      };

    case "error":
      return {
        label: "Needs retry",
        tone: "destructive",
      };

    case "idle":
      return {
        label: "Not analyzed",
        tone: "muted",
      };

    case "completed":
      if (
        analysis.result.retrieval.candidateIds
          .length === 0
      ) {
        return {
          label: "No scope evidence",
          tone: "muted",
        };
      }

      switch (
        analysis.result.comparison
          .overallRelationship
      ) {
        case "DIRECTLY_INCLUDED":
          return {
            label: "Directly included",
            tone: "success",
          };

        case "PARTIALLY_INCLUDED":
          return {
            label: "Partially included",
            tone: "warning",
          };

        case "EXPLICITLY_EXCLUDED":
        case "CONFLICTING":
          return {
            label:
              getRelationshipLabel(
                analysis.result
                  .comparison
                  .overallRelationship,
              ),
            tone: "destructive",
          };

        case "AMBIGUOUS":
          return {
            label: "Ambiguous",
            tone: "warning",
          };

        case "RELATED_NOT_INCLUDED":
        case "UNRELATED":
        default:
          return {
            label:
              getRelationshipLabel(
                analysis.result
                  .comparison
                  .overallRelationship,
              ),
            tone: "muted",
          };
      }
  }
}

function getStatusClasses(
  tone:
    | "muted"
    | "success"
    | "warning"
    | "destructive"
    | "ai",
) {
  switch (tone) {
    case "success":
      return "bg-success/10 text-success";

    case "warning":
      return "bg-warning/10 text-warning";

    case "destructive":
      return "bg-destructive/10 text-destructive";

    case "ai":
      return "bg-ai/10 text-ai";

    case "muted":
    default:
      return "bg-muted text-muted-foreground";
  }
}

function itemIdsForProgress(
  items: ClientRequestItem[],
  states: Record<string, AnalysisState>,
) {
  return items.filter(
    (item) => states[item.id]?.status === "running",
  ).length;
}

export function RequestItemsPanel({
  projectId,
  requestId,
  items,
  initialAnalyses,
  scopeBaselineVersion,
}: RequestItemsPanelProps) {
  const [confirmedItems, setConfirmedItems] =
    useState<ClientRequestItem[]>(items);

  const [suggestedItems, setSuggestedItems] =
    useState<string[]>([]);

  const [isBreakingDown, setIsBreakingDown] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isAnalyzingAll, setIsAnalyzingAll] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [activeItemId, setActiveItemId] =
    useState<string | null>(() => {
      const initialStates =
        items.map((item) => ({
          item,
          analysis:
            getInitialAnalysis(
              item.id,
              initialAnalyses,
            ),
        }));

      const firstUnreviewed =
        initialStates.find(
          ({ analysis }) =>
            analysis.status !==
            "completed",
        );

      return (
        firstUnreviewed?.item.id ??
        items[0]?.id ??
        null
      );
    });

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
  const itemsKey = useMemo(
    () =>
      items
        .map((item) => `${item.id}:${item.position}:${item.text}`)
        .join("|"),
    [items],
  );
   useEffect(() => {
    setConfirmedItems(items);

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

    setActiveItemId((current) => {
      if (
        current &&
        items.some(
          (item) => item.id === current,
        )
      ) {
        return current;
      }

      const firstUnreviewed =
        items.find((item) => {
          const analysis =
            getInitialAnalysis(
              item.id,
              initialAnalyses,
            );

          return (
            analysis.status !==
            "completed"
          );
        });

      return (
        firstUnreviewed?.id ??
        items[0]?.id ??
        null
      );
    });
    // `initialAnalyses` intentionally excluded.
    // It represents persisted server state used to initialize
    // the local analysis state. Revalidation after an analysis
    // must not overwrite live client-side results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);
  const activeItem = useMemo(
    () =>
      confirmedItems.find(
        (item) =>
          item.id === activeItemId,
      ) ?? null,
    [confirmedItems, activeItemId],
  );

  const activeAnalysis: AnalysisState =
    activeItem
      ? analysisStates[activeItem.id] ??
        {
          status: "idle",
        }
      : {
          status: "idle",
        };

  const activeIndex = activeItem
    ? confirmedItems.findIndex(
        (item) =>
          item.id === activeItem.id,
      )
    : -1;

  const hasSavedItems =
    confirmedItems.length > 0;

  const hasSuggestions =
    suggestedItems.length > 0;

  const isLastItem =
    activeIndex >=
      0 &&
    activeIndex ===
      confirmedItems.length - 1;

  const completedAnalysisCount =
    confirmedItems.filter(
      (item) =>
        analysisStates[item.id]?.status ===
        "completed",
    ).length;

  const runningAnalysisCount =
    confirmedItems.filter(
      (item) =>
        analysisStates[item.id]?.status ===
        "running",
    ).length;

  const analyzableItems =
    confirmedItems.filter((item) => {
      const status =
        analysisStates[item.id]?.status;

      return status !== "completed" &&
        status !== "running";
    });

  const allItemsAnalyzed =
    confirmedItems.length > 0 &&
    completedAnalysisCount ===
      confirmedItems.length;

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

      setActiveItemId(
        result.items[0]?.id ?? null,
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
    const currentStatus =
      analysisStates[itemId]?.status;

    if (
      currentStatus === "running" ||
      currentStatus === "completed" ||
      isAnalyzingAll
    ) {
      return;
    }

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

  async function handleAnalyzeAll() {
    const itemIds = analyzableItems.map(
      (item) => item.id,
    );

    if (itemIds.length === 0 || isAnalyzingAll) {
      return;
    }

    setError(null);
    setIsAnalyzingAll(true);

    const startedAt = Date.now();

    setAnalysisStates((current) => {
      const next = { ...current };

      for (const itemId of itemIds) {
        next[itemId] = {
          status: "running",
          startedAt,
        };
      }

      return next;
    });

    try {
      const response =
        await analyzeClientRequestItemsAction({
          projectId,
          requestId,
          itemIds,
        });

      const failureCount = response.results.filter(
        (result) => result.status === "FAILED",
      ).length;

      setAnalysisStates((current) => {
        const next = { ...current };

        for (const result of response.results) {
          if (
            result.status === "COMPLETED" ||
            result.status === "SKIPPED_COMPLETED"
          ) {
            if (
              result.result &&
              isScopeAnalysisResult(
                result.result,
              )
            ) {
              next[result.itemId] = {
                status: "completed",
                result: result.result,
              };
            } else {
              next[result.itemId] = {
                status: "error",
                message:
                  "Scope analysis returned an invalid result.",
              };
            }
            continue;
          }

          if (result.status === "SKIPPED_RUNNING") {
            next[result.itemId] = {
              status: "running",
              startedAt,
            };
            continue;
          }

          next[result.itemId] = {
            status: "error",
            message: result.error,
          };
        }

        return next;
      });

      if (failureCount > 0) {
        setError(
          `${failureCount} ask${failureCount === 1 ? "" : "s"} failed analysis. You can retry them individually.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to analyze the client asks.";

      setAnalysisStates((current) => {
        const next = { ...current };

        for (const itemId of itemIds) {
          next[itemId] = {
            status: "error",
            message,
          };
        }

        return next;
      });

      setError(message);
    } finally {
      setIsAnalyzingAll(false);
    }
  }

  function handleNextAsk() {
    if (
      activeIndex < 0 ||
      activeIndex >=
        confirmedItems.length - 1
    ) {
      return;
    }

    setActiveItemId(
      confirmedItems[
        activeIndex + 1
      ].id,
    );
  }

  function updateSuggestedItem(
    index: number,
    value: string,
  ) {
    setSuggestedItems((current) =>
      current.map(
        (item, itemIndex) =>
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

  return (
    <section>
      <div className="border-b border-border/70 pb-4">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ai/10">
                <ListChecks className="size-3.5 text-ai" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Decision queue
              </p>

              {hasSavedItems && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {confirmedItems.length}{" "}
                  {confirmedItems.length ===
                  1
                    ? "ask"
                    : "asks"}
                </span>
              )}
            </div>

            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
              Analyze each client ask
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Select an ask to review its relationship
              to the exact approved scope and inspect
              the evidence behind the comparison.
            </p>
          </div>

          {hasSavedItems && (
            <div className="flex shrink-0 items-center gap-2">
              {isAnalyzingAll ? (
                <span className="flex items-center gap-1.5 text-xs text-ai">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Analyzing {itemIdsForProgress(confirmedItems, analysisStates)} in parallel
                </span>
              ) : (
                <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                  <Check className="size-3.5 text-success" />
                  Breakdown confirmed
                </span>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAnalyzeAll}
                disabled={
                  isAnalyzingAll ||
                  analyzableItems.length === 0
                }
              >
                {isAnalyzingAll ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {isAnalyzingAll
                  ? "Analyzing…"
                  : allItemsAnalyzed
                    ? "All analyzed"
                    : "Analyze all"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/15 bg-destructive/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
        </div>
      )}

      {isBreakingDown ? (
        <BreakdownLoadingState />
      ) : hasSavedItems ? (
        <div className="mt-5">
          <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-background lg:grid-cols-[minmax(250px,0.35fr)_minmax(0,0.65fr)]">
            <DecisionQueueList
              items={confirmedItems}
              activeItemId={activeItemId}
              analysisStates={
                analysisStates
              }
              onSelect={setActiveItemId}
            />

            <div className="min-w-0 border-t border-border/70 lg:border-l lg:border-t-0">
              {activeItem ? (
                <AskDetailsPanel
                  item={activeItem}
                  analysis={activeAnalysis}
                  scopeBaselineVersion={
                    scopeBaselineVersion
                  }
                  onAnalyze={() =>
                    handleAnalyze(
                      activeItem.id,
                    )
                  }
                  onNext={handleNextAsk}
                  isLastItem={isLastItem}
                />
              ) : (
                <div className="flex min-h-[560px] items-center justify-center px-6">
                  <p className="text-sm text-muted-foreground">
                    Select an ask to review its
                    analysis.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-20 mt-4 border-t border-border/70 bg-background/95 px-1 py-3 backdrop-blur-md">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {allItemsAnalyzed
                  ? "Every atomic ask has completed scope analysis."
                  : activeAnalysis.status ===
                      "completed"
                    ? "This ask is ready for impact assessment."
                    : "Complete scope analysis for the selected ask before moving into impact assessment."}
              </p>

              <Button
                type="button"
                size="sm"
                disabled={
                  activeAnalysis.status !==
                  "completed"
                }
              >
                Proceed to Impact Assessment
              </Button>
            </div>
          </div>
        </div>
      ) : hasSuggestions ? (
        <BreakdownReview
          suggestedItems={
            suggestedItems
          }
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

function DecisionQueueList({
  items,
  activeItemId,
  analysisStates,
  onSelect,
}: {
  items: ClientRequestItem[];
  activeItemId: string | null;
  analysisStates: Record<
    string,
    AnalysisState
  >;
  onSelect: (
    itemId: string,
  ) => void;
}) {
  return (
    <div className="min-w-0 bg-muted/[0.18]">
      <div className="border-b border-border/70 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Client asks
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Select an ask to inspect its evidence.
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {items.map((item) => {
          const analysis =
            analysisStates[item.id] ??
            ({
              status: "idle",
            } satisfies AnalysisState);

          const isSelected =
            activeItemId === item.id;

          const status =
            getItemStatus(analysis);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onSelect(item.id)
              }
              className={[
                "group flex w-full items-start gap-3 px-4 py-4 text-left transition-colors",
                "hover:bg-background/80",
                isSelected
                  ? "bg-background shadow-[inset_3px_0_0_hsl(var(--primary))]"
                  : "",
              ].join(" ")}
              aria-current={
                isSelected
                  ? "true"
                  : undefined
              }
            >
              <span
                className={[
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {item.position}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block truncate text-sm leading-5",
                    isSelected
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/90",
                  ].join(" ")}
                  title={item.text}
                >
                  {item.text}
                </span>

                <span
                  className={[
                    "mt-2 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-4",
                    getStatusClasses(
                      status.tone,
                    ),
                  ].join(" ")}
                >
                  {status.label}
                </span>
              </span>

              <ChevronRight
                className={[
                  "mt-1 size-3.5 shrink-0 transition-all",
                  isSelected
                    ? "translate-x-0 text-primary"
                    : "-translate-x-0.5 text-muted-foreground/50 group-hover:text-muted-foreground",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AskDetailsPanel({
  item,
  analysis,
  scopeBaselineVersion,
  onAnalyze,
  onNext,
  isLastItem,
}: {
  item: ClientRequestItem;
  analysis: AnalysisState;
  scopeBaselineVersion: number;
  onAnalyze: () => void;
  onNext: () => void;
  isLastItem: boolean;
}) {
  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="border-b border-border/70 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {item.position}
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Item details
            </p>

            <h3 className="mt-1.5 max-w-4xl text-base font-semibold leading-6 tracking-[-0.015em] sm:text-lg">
              {item.text}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 sm:px-7 sm:py-6">
        {analysis.status ===
          "idle" && (
          <AskReadyState
            scopeBaselineVersion={
              scopeBaselineVersion
            }
            onAnalyze={onAnalyze}
          />
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
          <AskErrorState
            message={
              analysis.message
            }
            onRetry={onAnalyze}
          />
        )}

        {analysis.status ===
          "completed" && (
          <ScopeAnalysisResultView
            result={
              analysis.result
            }
          />
        )}
      </div>

      <div className="border-t border-border/70 px-5 py-3.5 sm:px-7">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant={
              isLastItem
                ? "outline"
                : "default"
            }
            size="sm"
            onClick={onNext}
            disabled={
              isLastItem ||
              analysis.status !==
                "completed"
            }
          >
            {isLastItem
              ? "Last ask"
              : "Next ask"}
            {!isLastItem && (
              <ArrowRight className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AskReadyState({
  scopeBaselineVersion,
  onAnalyze,
}: {
  scopeBaselineVersion: number;
  onAnalyze: () => void;
}) {
  return (
    <div className="max-w-2xl">
      <div className="border-l-2 border-ai/30 pl-4">
        <p className="text-sm font-semibold">
          Ready for scope analysis
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Scope Copilot will retrieve potentially
          relevant items from the pinned approved
          baseline and then perform a deeper semantic
          comparison.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            className="bg-ai text-ai-foreground hover:bg-ai/90"
            onClick={onAnalyze}
          >
            <Sparkles className="size-3.5" />
            Analyze against approved scope
          </Button>

          <span className="text-xs text-muted-foreground">
            Approved Scope v
            {scopeBaselineVersion}
          </span>
        </div>
      </div>
    </div>
  );
}

function AskErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-2xl border-l-2 border-destructive/30 pl-4">
      <p className="text-sm font-semibold text-destructive">
        Scope analysis failed
      </p>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-4"
        onClick={onRetry}
      >
        Try again
      </Button>
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
    const interval =
      window.setInterval(() => {
        setElapsed(
          Date.now() - startedAt,
        );
      }, 250);

    return () =>
      window.clearInterval(
        interval,
      );
  }, [startedAt]);

  const message =
    elapsed < 2000
      ? "Scanning approved baseline..."
      : elapsed < 4000
        ? "Retrieving candidate scope items..."
        : "Running deep semantic comparison...";

  return (
    <div
      className="max-w-3xl"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ai/10">
          <LoaderCircle className="size-4 animate-spin text-ai" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {message}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Comparing this ask against Approved Scope
            v{scopeBaselineVersion}.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-11/12 animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded-md bg-muted" />
        <div className="mt-5 h-16 w-full animate-pulse rounded-lg bg-muted/60" />
      </div>
    </div>
  );
}

function ScopeAnalysisResultView({
  result,
}: {
  result: ScopeAnalysisResult;
}) {
  const hasEvidence =
    result.comparison
      .comparisons.length > 0;

  const hasRetrievedCandidates =
    result.retrieval
      .candidateIds.length > 0;

  return (
    <div className="max-w-4xl">
      <div className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Scope relationship
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {hasRetrievedCandidates ? (
                <ScopeRelationshipBadge
                  relationship={
                    result.comparison
                      .overallRelationship
                  }
                />
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  No matching scope evidence
                </span>
              )}

              {hasRetrievedCandidates && (
                <span className="text-xs text-muted-foreground">
                  {result.comparison.confidence?.toLowerCase()}{" "}
                  confidence
                </span>
              )}
            </div>
          </div>

          <span className="text-xs text-muted-foreground">
            Approved Scope v
            {result.scopeBaseline.version}
          </span>
        </div>
      </div>

      {!hasEvidence ? (
        <NoScopeEvidenceState />
      ) : (
        <div className="pt-5">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Evidence reviewed
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              These approved-scope passages were retrieved
              and compared against the client ask.
            </p>
          </div>

          <div className="space-y-6">
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
                  <EvidenceRecord
                    key={
                      comparison.scopeItemId
                    }
                    title={title}
                    relationship={
                      comparison.relationship
                    }
                    explanation={
                      comparison.explanation
                    }
                    references={
                      candidate.sourceReferences
                    }
                  />
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceRecord({
  title,
  relationship,
  explanation,
  references,
}: {
  title: string;
  relationship: ScopeRelationship;
  explanation: string;
  references: Array<{
    quote: string;
    section?: string;
  }>;
}) {
  return (
    <article className="border-l-2 border-border pl-4 sm:pl-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <ScopeRelationshipBadge
          relationship={relationship}
          compact
        />

        <p className="text-sm font-semibold text-foreground">
          {title}
        </p>
      </div>

      <p className="mt-2.5 max-w-3xl text-sm leading-6 text-foreground/90">
        {explanation}
      </p>

      {references.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {references.map(
            (reference, index) => (
              <blockquote
                key={`${title}-${index}`}
                className="max-w-3xl border-l border-primary/30 pl-3.5 text-sm italic leading-6 text-muted-foreground"
              >
                “{reference.quote}”
              </blockquote>
            ),
          )}
        </div>
      )}
    </article>
  );
}

function NoScopeEvidenceState() {
  return (
    <div className="pt-6">
      <div className="max-w-2xl border-l-2 border-border pl-4">
        <p className="text-sm font-semibold">
          No matching approved scope evidence
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          The retrieval engine did not identify an
          approved scope item requiring deeper
          comparison for this ask.
        </p>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This means no matching evidence was found in
          the pinned baseline. It is not presented as a
          confidence judgment, and the request should
          continue through impact assessment before a
          commercial decision is made.
        </p>
      </div>
    </div>
  );
}

function BreakdownLoadingState() {
  return (
    <div className="mt-5 bg-muted/40 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-ai/10">
          <LoaderCircle className="size-5 animate-spin text-ai" />
        </div>

        <p className="mt-3 text-sm font-semibold">
          Analyzing client request…
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Identifying the individual asks in the
          original client message.
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
    <div className="mt-5 bg-ai/5 px-6 py-9 sm:px-10 sm:py-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-ai/10">
          <Sparkles className="size-5 text-ai" />
        </div>

        <p className="mt-3 text-sm font-semibold">
          Ready to analyze the client request
        </p>

        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Scope Copilot will identify the separate asks
          from the original client message. You&apos;ll
          review the suggestions before anything is
          saved.
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
      <div className="bg-ai/5 px-4 py-3.5">
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
              Check each ask against the original client
              message. Edit or remove anything inaccurate
              before saving.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {suggestedItems.map(
          (item, index) => (
            <div
              key={`${index}-${item}`}
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
            AI suggestions aren&apos;t saved until you
            approve this breakdown.
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