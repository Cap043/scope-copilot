"use client";

import {
  Check,
  ListChecks,
  LoaderCircle,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

import {
  decomposeClientRequestAction,
  saveClientRequestItemsAction,
} from "@/app/(dashboard)/projects/[projectId]/requests/actions";

type ClientRequestItem = {
  id: string;
  position: number;
  text: string;
};

type RequestItemsPanelProps = {
  projectId: string;
  requestId: string;
  items: ClientRequestItem[];
};

export function RequestItemsPanel({
  projectId,
  requestId,
  items,
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
    const cleanedItems = suggestedItems
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

      /*
       * The server has already persisted these items.
       * Update the current workspace directly instead of
       * refreshing the entire Server Component tree.
       */
      setConfirmedItems(result.items);
      setSuggestedItems([]);
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

  function removeSuggestedItem(index: number) {
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
    element.style.height = `${element.scrollHeight}px`;
  }

  const hasSavedItems =
    confirmedItems.length > 0;

  const hasSuggestions =
    suggestedItems.length > 0;

  return (
    <Card className="overflow-visible">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-ai/10">
                <ListChecks className="size-3.5 text-ai" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Request analysis
              </p>

              <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Step 1
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
              Break down the client request
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Separate the client&apos;s message into independent asks
              before comparing each ask against the approved scope.
            </p>
          </div>

          {hasSavedItems && (
            <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
              <Check className="size-3.5 text-primary" />

              <span className="text-xs font-medium text-muted-foreground">
                {confirmedItems.length}{" "}
                {confirmedItems.length === 1
                  ? "ask"
                  : "asks"}{" "}
                confirmed
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm leading-relaxed text-destructive">
              {error}
            </p>
          </div>
        )}

        {/* AI processing state */}
        {isBreakingDown ? (
          <div className="rounded-xl border border-ai/20 bg-ai/5 px-6 py-10">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="flex size-11 items-center justify-center rounded-xl border border-ai/20 bg-ai/10 shadow-sm">
                <LoaderCircle className="size-5 animate-spin text-ai" />
              </div>

              <p className="mt-3 text-sm font-semibold">
                Analyzing client request…
              </p>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Identifying the individual asks in the original client
                message.
              </p>

              <div className="mt-5 w-full max-w-xl space-y-2">
                <div className="h-2 animate-pulse rounded-full bg-ai/10" />
                <div className="h-2 w-4/5 animate-pulse rounded-full bg-ai/10" />
                <div className="h-2 w-3/5 animate-pulse rounded-full bg-ai/10" />
              </div>
            </div>
          </div>
        ) : hasSavedItems ? (
          /* Confirmed human-reviewed state */
          <div>
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Check className="size-4 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Breakdown confirmed
                  </p>

                  <p className="text-xs text-muted-foreground">
                    These asks are ready for scope analysis.
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                {confirmedItems.length}{" "}
                {confirmedItems.length === 1
                  ? "atomic ask"
                  : "atomic asks"}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {confirmedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border bg-background px-3.5 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                    {item.position}
                  </span>

                  <p className="min-w-0 whitespace-pre-wrap break-words pt-0.5 text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Placeholder for the next engineering milestone. */}
            <div className="mt-5 rounded-xl border border-dashed bg-muted/10 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ListChecks className="size-3.5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Scope analysis
                    </p>

                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Compare each confirmed ask against the approved scope.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Next
                </span>
              </div>
            </div>
          </div>
        ) : hasSuggestions ? (
          /* AI suggestion review state */
          <div>
            <div className="rounded-xl border border-ai/20 bg-ai/5 px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ai/10">
                  <Sparkles className="size-4 text-ai" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      Review AI-generated breakdown
                    </h3>

                    <span className="rounded-full border border-ai/20 bg-ai/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-ai">
                      AI suggestion
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Check each ask against the original client message.
                    Edit or remove anything that is inaccurate before saving.
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
                        autoGrow(event.currentTarget)
                      }
                      rows={1}
                      disabled={isSaving}
                      aria-label={`Atomic request item ${index + 1}`}
                      className="min-h-10 min-w-0 flex-1 resize-none overflow-hidden rounded-lg border bg-background px-3 py-2 text-sm leading-5 outline-none ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ai focus:ring-2 focus:ring-ai/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        removeSuggestedItem(index)
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

            {/* Sticky review action bar */}
            <div className="sticky bottom-0 z-20 -mx-5 mt-5 border-t bg-background/95 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  AI suggestions aren&apos;t saved until you approve this
                  breakdown.
                </p>

                <div className="flex shrink-0 items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSuggestedItems([]);
                      setError(null);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={
                      isSaving ||
                      suggestedItems.every(
                        (item) => !item.trim(),
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
                        {suggestedItems.length === 1
                          ? "atomic ask"
                          : "atomic asks"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Initial AI analysis state */
          <div className="rounded-xl border border-ai/20 bg-ai/5 px-6 py-9 sm:px-10 sm:py-10">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="flex size-11 items-center justify-center rounded-xl border border-ai/20 bg-ai/10">
                <Sparkles className="size-5 text-ai" />
              </div>

              <p className="mt-3 text-sm font-semibold">
                Ready to analyze the client request
              </p>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Scope Copilot will identify the separate asks from the
                original client message. You&apos;ll review the suggestions
                before anything is saved.
              </p>

              <Button
                type="button"
                size="sm"
                className="mt-5 bg-ai text-ai-foreground hover:bg-ai/90"
                onClick={handleBreakdown}
              >
                <Sparkles className="size-3.5" />
                Analyze client request
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}