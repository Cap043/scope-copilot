import Link from "next/link";
import {
  ArrowUpRight,
  Inbox,
  Plus,
} from "lucide-react";

import { getProject } from "@/lib/projects";
import { getClientRequests } from "@/lib/requests";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { RequestCard } from "@/components/projects/request/request-card";
import type { RequestStatus } from "@/components/projects/request/request-status-badge";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface RequestsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

function getRequestTitle(text: string) {
  const firstLine =
    text
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "Client request";

  if (firstLine.length <= 72) {
    return firstLine;
  }

  return `${firstLine.slice(0, 69).trimEnd()}…`;
}

function getRequestPreview(text: string) {
  return text.trim();
}

function formatCreatedAt(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function RequestsPage({
  params,
}: RequestsPageProps) {
  const { projectId } = await params;

  const project = await getProject(projectId);

  if (!project) {
    return (
      <div className="px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Project not found
          </h1>
        </div>
      </div>
    );
  }

  const requests = await getClientRequests(project.id);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-8">
        <ProjectWorkspaceHeader
          projectId={project.id}
          projectName={project.name}
          clientName={project.client.name}
          value={project.value}
          status="Active"
        />

        <ProjectWorkspaceNav projectId={project.id} />

        <div className="mt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Requests
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Client requests
              </h2>

              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Review client requests against the project&apos;s approved
                scope before committing to the work.
              </p>
            </div>

            <Link
              href={`/projects/${project.id}/requests/new`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              New Client Request
            </Link>
          </div>

          {requests.length === 0 ? (
            <Card className="mt-7">
              <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl border bg-muted">
                  <Inbox className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  No client requests yet
                </h3>

                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  When a client asks for something new, you&apos;ll be able to
                  analyze it here against the approved project scope.
                </p>

                <Link
                  href={`/projects/${project.id}/requests/new`}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                >
                  Start a client request
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {requests.length}{" "}
                  {requests.length === 1
                    ? "request"
                    : "requests"}
                </p>
              </div>

              <div className="space-y-3">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    projectId={project.id}
                    requestId={request.id}
                    title={getRequestTitle(
                      request.originalText,
                    )}
                    preview={getRequestPreview(
                      request.originalText,
                    )}
                    status={
                      request.status as RequestStatus
                    }
                    analyzedAgainstVersion={
                      request
                        .analyzedAgainstBaseline
                        .version
                    }
                    createdLabel={formatCreatedAt(
                      request.createdAt,
                    )}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}