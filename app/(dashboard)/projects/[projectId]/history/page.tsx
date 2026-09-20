import Link from "next/link";
import {
  ArrowLeft,
  History,
} from "lucide-react";

import { getProject } from "@/lib/projects";
import { getScopeVersionHistory } from "@/lib/scope-versions";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { ScopeVersionHistory } from "@/components/projects/scope/scope-version-history";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface HistoryPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function HistoryPage({
  params,
}: HistoryPageProps) {
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
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const versions =
    await getScopeVersionHistory(project.id);

  const currentVersion =
    project.scopeBaselines[0]?.version;

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

        <ProjectWorkspaceNav
          projectId={project.id}
        />

        <div className="mt-7">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              History
            </p>

            <div className="mt-1 flex items-center gap-2">
              <History className="size-5 text-muted-foreground" />

              <h2 className="text-2xl font-semibold tracking-tight">
                Scope history
              </h2>
            </div>

            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Inspect every stored scope version without changing the
              current baseline.
            </p>
          </div>

          {versions.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-60 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl border bg-muted">
                  <History className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  No scope versions yet
                </h3>

                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Scope versions will appear here once the project has a
                  captured baseline.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScopeVersionHistory
              projectId={project.id}
              versions={versions}
              currentVersion={currentVersion}
            />
          )}
        </div>
      </div>
    </div>
  );
}