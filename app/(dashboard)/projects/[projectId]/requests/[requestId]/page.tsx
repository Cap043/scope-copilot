import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";

import {
  getClientRequest,
} from "@/lib/requests";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
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

        <div className="mt-7">
          <Link
            href={`/projects/${request.project.id}/requests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Client requests
          </Link>

          <div className="mt-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Client request
              </p>

              <RequestStatusBadge status={status} />
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Request captured
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This request is stored as a historical record and pinned to the
              exact approved scope version used when it was captured.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
            <Card>
              <CardHeader className="border-b px-5 py-4 sm:px-6">
                <CardTitle>Original request</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Captured exactly as entered.
                </p>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                <div className="whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed">
                  {request.originalText}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader className="px-5 py-4 sm:px-6">
                  <CardTitle>Scope reference</CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <CheckCircle2 className="size-4 text-success" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Approved Scope v
                        {
                          request
                            .analyzedAgainstBaseline
                            .version
                        }
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        This is the exact baseline pinned to this request.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-5 py-4 sm:px-6">
                  <CardTitle>Captured</CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Clock3 className="size-4 text-muted-foreground" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {formatDate(
                          request.createdAt,
                        )}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Request persistence is complete. Analysis has not run
                        yet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}