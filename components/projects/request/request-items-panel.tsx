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
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  const router = useRouter();

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
      await saveClientRequestItemsAction({
        projectId,
        requestId,
        items: cleanedItems,
      });

      setSuggestedItems([]);
      router.refresh();
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

  return (
    <Card>
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 shrink-0 text-muted-foreground" />

              <CardTitle>
                Atomic request items
              </CardTitle>
            </div>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Separate the client&apos;s message into independent asks
              before scope analysis.
            </p>
          </div>

          {items.length === 0 &&
            suggestedItems.length === 0 &&
            !isBreakingDown && (
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={handleBreakdown}
              >
                <Sparkles className="size-4" />
                Analyze client request
              </Button>
            )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5">
            <p className="text-sm leading-relaxed text-destructive">
              {error}
            </p>
          </div>
        )}

        {isBreakingDown ? (
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                <LoaderCircle className="size-4 animate-spin text-primary" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Analyzing request…
                </p>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Identifying the individual client asks. This may
                  take a few seconds.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2 animate-pulse rounded-full bg-muted" />
              <div className="h-2 w-4/5 animate-pulse rounded-full bg-muted" />
              <div className="h-2 w-3/5 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ) : items.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/20 px-3.5 py-3">
              <Check className="size-4 shrink-0 text-primary" />

              <p className="text-sm text-muted-foreground">
                {items.length}{" "}
                {items.length === 1
                  ? "atomic ask"
                  : "atomic asks"}{" "}
                saved and ready for scope analysis.
              </p>
            </div>

            <ol className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border bg-background p-3.5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {item.position}
                  </span>

                  <p className="min-w-0 whitespace-pre-wrap break-words pt-0.5 text-sm leading-relaxed">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : suggestedItems.length > 0 ? (
          <div>
            <div className="mb-5 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                  <Sparkles className="size-4 text-ai" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Review AI-generated breakdown
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Check each ask against the original client message.
                    You can edit or remove anything before saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {suggestedItems.map(
                (item, index) => (
                  <div
                    key={`${index}-${item}`}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
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
                      rows={2}
                      disabled={isSaving}
                      aria-label={`Atomic request item ${index + 1}`}
                      className="min-h-16 flex-1 resize-y rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeSuggestedItem(index)
                      }
                      disabled={isSaving}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ),
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Nothing is saved until you approve this breakdown.
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
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
                      <LoaderCircle className="size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save atomic items
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/10 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ListChecks className="size-4 text-muted-foreground" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Ready to analyze
                </p>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Scope Copilot will identify the separate client asks
                  from the original message. You&apos;ll review the
                  suggestions before anything is saved.
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="mt-4 w-full sm:w-auto"
              onClick={handleBreakdown}
            >
              <Sparkles className="size-4" />
              Analyze client request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}