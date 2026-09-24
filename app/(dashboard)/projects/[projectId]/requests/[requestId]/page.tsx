import Link from "next/link";
import {
  ArrowLeft,
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
        {/* Keep the project context and primary project action visible while scrolling. */}
        <div className="sticky top-0 z-30 -mx-5 bg-background/95 px-5 pb-1 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ProjectWorkspaceHeader
            projectId={request.project.id}
            projectName={request.project.name}
            clientName={
              request.project.client.name
            }
            value={request.project.value}
            status="Active"
          />

          <ProjectWorkspaceNav
            projectId={request.project.id}
          />
        </div>

        <div className="mt-7">
          <Link
            href={`/projects/${request.project.id}/requests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Client requests
          </Link>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Client request
              </p>

              <RequestStatusBadge
                status={status}
              />
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Review client request
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The original client wording is preserved, and this case
              remains pinned to the exact approved scope version used
              when it was captured.
            </p>
          </div>

          {/* Request metadata is context, so keep it close to the title rather than below the work area. */}
          <section
            aria-label="Request context"
            className="mt-6 grid gap-3 sm:grid-cols-2"
          >
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="size-4 text-primary" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Scope reference
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Approved Scope v
                    {
                      request
                        .analyzedAgainstBaseline
                        .version
                    }
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The exact baseline pinned to this request.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock3 className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Captured
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(
                      request.createdAt,
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Original request stored as historical evidence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader className="border-b px-5 py-4 sm:px-6">
                <CardTitle>
                  Original request
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Captured exactly as entered. This wording is preserved
                  as the original client evidence.
                </p>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                <div className="whitespace-pre-wrap break-words rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed sm:p-5">
                  {request.originalText}
                </div>
              </CardContent>
            </Card>

            <RequestItemsPanel
              projectId={request.project.id}
              requestId={request.id}
              items={request.items}
            />
          </div>
        </div>
      </div>
    </div>
  );
}