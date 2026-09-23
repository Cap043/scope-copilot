import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getProject } from "@/lib/projects";

import { ScopeInput } from "@/components/projects/scope/scope-input";
import { ScopeReview } from "@/components/projects/scope/scope-review";
import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";

import type { NormalizedScope } from "@/lib/scope-schema";

interface ScopePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ScopePage({
  params,
}: ScopePageProps) {
  const { projectId } = await params;

  const project = await getProject(projectId);

  if (!project) {
    return (
      <div className="h-full overflow-y-auto px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Project not found
          </h1>

          <Link
            href="/projects"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </div>
      </div>
    );
  }

  const baseline =
    project.scopeBaselines[0];

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl min-h-0 flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Project identity and project-level navigation remain fixed. */}
        <div className="shrink-0">
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
        </div>

        {!baseline ? (
          /*
           * Without a baseline the SOW capture form is the only
           * scrollable region. The surrounding workspace stays fixed.
           */
          <div className="min-h-0 flex-1 overflow-y-auto pt-3 sm:pt-4">
            <ScopeInput
              projectId={project.id}
            />
          </div>
        ) : (
          /*
           * ScopeReview owns the inner workspace scrolling:
           * toolbar + summary stay fixed while the actual
           * list/detail workspace can scroll independently.
           */
          <div className="min-h-0 flex-1 overflow-hidden pt-3">
            <ScopeReview
              projectId={project.id}
              baselineId={baseline.id}
              status={baseline.status}
              scope={
                baseline.structuredScope as NormalizedScope
              }
              scopeVersion={baseline.version}
              sourceText={baseline.sourceText}
            />
          </div>
        )}
      </div>
    </div>
  );
}