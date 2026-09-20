import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus } from "lucide-react";

import { ProjectForm } from "@/components/projects/project-form";
import { ProjectCard } from "@/components/projects/project-card";
import { getProjects } from "@/lib/projects";

import { Card, CardContent } from "@/components/ui/card";

export default async function ProjectsPage() {
  // Load projects through the existing organization-isolated
  // database boundary.
  const projects = await getProjects();

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
        {/* Page header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Manage your projects and the scope agreed with each client.
            </p>
          </div>

          <ProjectForm />
        </div>

        {/* Project count */}
        {projects.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1
                ? "project"
                : "projects"}
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to overview
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-0">
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/60">
                  <FolderKanban className="size-5 text-muted-foreground" />
                </div>

                <h2 className="mt-5 text-base font-semibold tracking-tight">
                  No projects yet
                </h2>

                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Create your first project to establish its scope and
                  start keeping client requests tied to what was actually
                  agreed.
                </p>

                <div className="mt-5">
                  <ProjectForm />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Project grid */
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}