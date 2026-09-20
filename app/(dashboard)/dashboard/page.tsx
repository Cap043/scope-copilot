import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
  Plus,
  Wallet,
} from "lucide-react";

import { getProjects } from "@/lib/projects";

import { Card, CardContent } from "@/components/ui/card";

function formatCurrency(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
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

export default async function DashboardPage() {
  // Load the authenticated organization's real projects.
  const projects = await getProjects();

  const totalProjectValue = projects.reduce(
    (total, project) => total + Number(project.value),
    0,
  );

  const projectsWithDeadlines = projects.filter(
    (project) => project.targetEndDate !== null,
  ).length;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
        {/* Page header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Overview
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Good morning
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Keep your projects and agreed scope organized in one
              workspace.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <Plus className="size-4" />
            New project
          </Link>
        </div>

        {/* Workspace summary */}
        <section
          aria-label="Workspace summary"
          className="mt-8 grid gap-3 lg:grid-cols-3"
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Projects
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {projects.length}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Projects in your workspace
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FolderKanban className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Portfolio value
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatCurrency(totalProjectValue)}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Combined value of your projects
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Wallet className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    With target dates
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {projectsWithDeadlines}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Projects with a defined target end
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <CalendarDays className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Project list */}
        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Your projects
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Projects currently available in this workspace.
              </p>
            </div>

            {projects.length > 0 && (
              <Link
                href="/projects"
                className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/60">
                    <FolderKanban className="size-5 text-muted-foreground" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    No projects yet
                  </h3>

                  <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Create your first project to establish its scope and
                    start using Scope Copilot as your project workspace.
                  </p>

                  <Link
                    href="/projects"
                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    <Plus className="size-4" />
                    Create project
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group block px-5 py-4 transition-colors hover:bg-muted/30 sm:px-6"
                    >
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                        {/* Project identity */}
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-sm font-semibold tracking-[-0.01em]">
                              {project.name}
                            </h3>

                            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>

                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {project.client.name}
                          </p>
                        </div>

                        {/* Project value */}
                        <div className="sm:min-w-28 sm:text-right">
                          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Value
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatCurrency(project.value)}
                          </p>
                        </div>

                        {/* Target date */}
                        <div className="sm:min-w-32 sm:text-right">
                          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Target end
                          </p>

                          <p className="mt-1 text-sm text-foreground">
                            {formatDate(project.targetEndDate)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}