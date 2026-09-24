import {
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { notFound } from "next/navigation";

import { getClientRequest } from "@/lib/requests";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { RequestItemsPanel } from "@/components/projects/request/request-items-panel";
import { RequestStatusBadge } from "@/components/projects/request/request-status-badge";
import type { RequestStatus } from "@/components/projects/request/request-status-badge";

interface RequestDetailPageProps {
  params: Promise<{
    projectId: string;
    requestId: string;
  }>;
}

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const {
    projectId,
    requestId,
  } = await params;

  const request = await getClientRequest(
    projectId,
    requestId,
  );

  if (!request) {
    notFound();
  }

  const status =
    request.status as RequestStatus;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* 
         * Project-level context stays pinned while the request
         * analysis workspace scrolls underneath it.
         *
         * Header + project navigation intentionally live in the
         * same sticky container so they never separate while scrolling.
         */}
        <div className="sticky top-0 z-40 -mx-5 bg-background/95 px-5 pb-1 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ProjectWorkspaceHeader
            projectId={request.project.id}
            projectName={request.project.name}
            clientName={request.project.client.name}
            value={request.project.value}
            status="Active"
          />

          <ProjectWorkspaceNav
            projectId={request.project.id}
          />
        </div>

        <main className="mt-5">
          {/* Request identity + compact scope context */}
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  Request Analysis
                </h2>

                <RequestStatusBadge
                  status={status}
                />
              </div>

              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Review the client request, break it into atomic asks,
                and prepare it for scope analysis.
              </p>
            </div>

            {/* Compact request metadata */}
            <section
              aria-label="Request context"
              className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                  <CheckCircle2 className="size-3.5 text-primary" />
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                    Scope
                  </p>

                  <p className="font-semibold">
                    Approved Scope v
                    {
                      request
                        .analyzedAgainstBaseline
                        .version
                    }
                  </p>
                </div>
              </div>

              <div className="hidden h-7 w-px bg-border sm:block" />

              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Clock3 className="size-3.5 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                    Captured
                  </p>

                  <p className="font-semibold">
                    {formatDate(
                      request.createdAt,
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 
           * Immutable original client evidence.
           * Collapsed by default so the analysis workspace gets
           * the majority of the vertical space.
           */}
          <details className="group mt-4 rounded-xl border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                    Original client request
                  </p>

                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                    Immutable evidence
                  </span>
                </div>

                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {request.originalText}
                </p>
              </div>

              <svg
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="m6 9 6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>

            <div className="border-t px-4 py-4 sm:px-5">
              <div className="whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed">
                {request.originalText}
              </div>
            </div>
          </details>

          {/* Main request-analysis workspace */}
          <div className="mt-4">
            <RequestItemsPanel
              projectId={request.project.id}
              requestId={request.id}
              items={request.items}
            />
          </div>
        </main>
      </div>
    </div>
  );
}