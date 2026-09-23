"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  ArrowRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { createClientRequestAction } from "@/app/(dashboard)/projects/[projectId]/requests/actions";

type RequestFormProps = {
  projectId: string;
  hasScopeBaseline: boolean;
};

export function RequestForm({
  projectId,
  hasScopeBaseline,
}: RequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [request, setRequest] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const originalText = request;

    if (!originalText.trim()) {
      setError("Enter the client's request before continuing.");
      return;
    }

    if (!hasScopeBaseline) {
      setError(
        "An approved scope baseline is required before capturing a request.",
      );
      return;
    }

    if (isPending) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await createClientRequestAction({
          projectId,
          originalText,
        });

        router.push(
          `/projects/${projectId}/requests/${result.id}`,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to capture the client request.",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="size-4 text-muted-foreground" />
          </div>

          <div>
            <CardTitle>Client request</CardTitle>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Capture the client&apos;s wording exactly as you received it.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="request">
              Request details
            </Label>

            <textarea
              id="request"
              value={request}
              onChange={(event) => {
                setRequest(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              disabled={isPending}
              placeholder="Example: Can you also add downloadable monthly reports to the dashboard?"
              className="min-h-64 w-full resize-y rounded-lg border border-input bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              Keep the original wording. Context can be added when it is
              important to understanding the request.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5">
              <p className="text-sm leading-relaxed text-destructive">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-ai" />

              <span>
                {!hasScopeBaseline
                  ? "Define and approve scope before capturing requests."
                  : "The request will be stored against the current approved scope."}
              </span>
            </div>

            <Button
              type="submit"
              disabled={
                !request.trim() ||
                !hasScopeBaseline ||
                isPending
              }
              className="w-full sm:w-auto"
            >
              {isPending
                ? "Saving request..."
                : "Capture request"}

              {!isPending && <ArrowRight />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}