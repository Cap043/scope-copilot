import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  Layers3,
  ListChecks,
} from "lucide-react";

import { getProject } from "@/lib/projects";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { NormalizedScope } from "@/lib/scope-schema";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { projectId } = await params;

  const project = await getProject(projectId);

  if (!project) {
    return (
      <div className="px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Project not found
          </h1>

          <Link
            href="/projects"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Projects
          </Link>
        </div>
      </div>
    );
  }

  const baseline = project.scopeBaselines[0];

  const scope =
    baseline?.structuredScope as NormalizedScope | undefined;

  const scopeStatus = baseline?.status ?? null;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
        <ProjectWorkspaceHeader
          projectId={project.id}
          projectName={project.name}
          clientName={project.client.name}
          value={project.value}
          status="Active"
        />

        <ProjectWorkspaceNav
          projectId={project.id}
        />

        {/* Overview */}
        <section className="mt-6">
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              Overview
            </p>

            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Project at a glance
            </h2>
          </div>

          {/* Compact project facts */}
          <div className="grid divide-y rounded-xl border border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {scopeStatus === "APPROVED" ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : (
                  <FileText className="size-3.5" />
                )}

                <span>Scope</span>
              </div>

              <p className="mt-2 text-sm font-semibold">
                {scopeStatus ?? "Not defined"}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {baseline
                  ? `Version ${baseline.version}`
                  : "No baseline yet"}
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Layers3 className="size-3.5" />
                <span>Deliverables</span>
              </div>

              <p className="mt-2 text-sm font-semibold">
                {scope?.deliverables.length ?? 0}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                In current scope
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ListChecks className="size-3.5" />
                <span>Features</span>
              </div>

              <p className="mt-2 text-sm font-semibold">
                {scope?.features.length ?? 0}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                In current scope
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>Timeline</span>
              </div>

              <p className="mt-2 truncate text-sm font-semibold">
                {scope?.timeline.duration ?? "Not set"}
              </p>

              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {scope
                  ? scope.timeline.startCondition ??
                    "No start condition"
                  : "No scope timeline"}
              </p>
            </div>
          </div>
        </section>

        {/* Scope status */}
        <section className="mt-6">
          <Card>
            <CardHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle>Scope status</CardTitle>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Your approved scope is the reference point for future
                    client requests.
                  </p>
                </div>

                <Link
                  href={`/projects/${project.id}/scope`}
                  className="shrink-0 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View scope
                  <ArrowUpRight className="ml-1 inline size-3.5" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {!baseline ? (
                <div className="flex flex-col gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Scope has not been defined
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Capture the agreed project scope before evaluating
                        client changes.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${project.id}/scope`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Define scope
                  </Link>
                </div>
              ) : baseline.status === "DRAFT" ? (
                <div className="flex flex-col gap-4 rounded-lg border border-warning/20 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                      <CircleAlert className="size-4 text-warning" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Scope draft needs review
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Review and approve the scope before using it as the
                        project's commercial reference.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${project.id}/scope`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Review scope
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-lg border border-success/15 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <CheckCircle2 className="size-4 text-success" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Scope v{baseline.version} is approved
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        This locked baseline is the reference for future
                        client requests.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${project.id}/scope`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    Open scope
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Project metadata */}
        <section className="mt-6">
          <Card>
            <CardContent className="grid gap-5 p-5 sm:grid-cols-4 sm:p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Project value
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {formatCurrency(project.value)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Client
                </p>

                <p className="mt-1.5 truncate text-sm font-medium">
                  {project.client.name}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Start date
                </p>

                <p className="mt-1.5 text-sm font-medium">
                  {formatDate(project.startDate)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Target end
                </p>

                <p className="mt-1.5 text-sm font-medium">
                  {formatDate(project.targetEndDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next step */}
        <section className="mt-6">
          <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Next step
              </p>

              {baseline?.status === "APPROVED" ? (
                <>
                  <h2 className="mt-1 text-sm font-semibold">
                    Ready for client requests
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Use the approved scope whenever a client asks for
                    something new.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-1 text-sm font-semibold">
                    Establish the approved scope
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Define and approve the scope before relying on
                    Scope Copilot for scope-change decisions.
                  </p>
                </>
              )}
            </div>

            <Link
              href={
                baseline?.status === "APPROVED"
                  ? `/projects/${project.id}/requests/new`
                  : `/projects/${project.id}/scope`
              }
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              {baseline?.status === "APPROVED"
                ? "Start a client request"
                : "Open scope"}

              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}