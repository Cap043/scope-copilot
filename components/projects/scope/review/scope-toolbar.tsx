"use client";

import Link from "next/link";
import {
  Check,
  FileText,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ScopeReviewController } from "./types";

export function ScopeToolbar({
  projectId,
  scopeVersion,
  sourceText,
  currentStatus,
  savingSection,
  approving,
  creatingVersion,
  saveError,
  handleApprove,
  handleCreateVersion,
}: Pick<
  ScopeReviewController,
  | "currentStatus"
  | "savingSection"
  | "approving"
  | "creatingVersion"
  | "saveError"
  | "handleApprove"
  | "handleCreateVersion"
> & {
  projectId: string;
  scopeVersion?: number;
  sourceText?: string;
}) {
  return (
    <section className="shrink-0 rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                Scope baseline
                {scopeVersion
                  ? ` v${scopeVersion}`
                  : ""}
              </h2>

              <Badge
                variant={
                  currentStatus === "APPROVED"
                    ? "success"
                    : "warning"
                }
              >
                {currentStatus}
              </Badge>
            </div>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {currentStatus === "APPROVED"
                ? "Locked reference baseline for future client requests."
                : "Review and approve the extracted scope when it is accurate."}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
          {sourceText && (
            <details className="relative">
              <summary className="flex h-8 w-full cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted sm:w-auto sm:justify-start [&::-webkit-details-marker]:hidden">
                <FileText className="mr-1.5 size-3.5" />
                Original SOW
              </summary>

              <div className="fixed left-4 right-4 top-20 z-[100] max-h-[calc(100dvh-6rem)] overflow-hidden rounded-xl border border-border bg-card p-4 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-[min(560px,calc(100vw-2rem))] sm:max-h-[70vh]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Original scope document
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Immutable client-provided source material.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Source
                  </span>
                </div>

                <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-lg border bg-muted/20 p-4 sm:max-h-[55vh]">
                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                    {sourceText}
                  </p>
                </div>
              </div>
            </details>
          )}

          {currentStatus === "DRAFT" && (
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleApprove}
              disabled={
                approving || Boolean(savingSection)
              }
            >
              <Check className="size-3.5" />
              {approving
                ? "Approving..."
                : "Approve scope"}
            </Button>
          )}

          {currentStatus === "APPROVED" && (
            <>
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/projects/${projectId}/scope/update`}
                  />
                }
              >
                Update SOW
              </Button>

              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleCreateVersion}
                disabled={creatingVersion}
              >
                <Plus className="size-3.5" />
                {creatingVersion
                  ? "Creating..."
                  : "New version"}
              </Button>
            </>
          )}
        </div>
      </div>

      {(savingSection || saveError) && (
        <div className="mt-2">
          {savingSection && (
            <p className="text-[11px] text-muted-foreground">
              Saving {savingSection}...
            </p>
          )}

          {saveError && (
            <p className="mt-1 text-xs text-destructive">
              {saveError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
