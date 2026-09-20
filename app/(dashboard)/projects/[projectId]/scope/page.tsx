import Link from "next/link";
import {
  ArrowLeft,
  History,
} from "lucide-react";

import { getProject } from "@/lib/projects";

import { ScopeInput } from "@/components/projects/scope/scope-input";
import { ScopeReview } from "@/components/projects/scope/scope-review";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";

import type { NormalizedScope } from "@/lib/scope-schema";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const baseline =
    project.scopeBaselines[0];

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

        {!baseline ? (
          <div className="mt-7">
            <ScopeInput projectId={project.id} />
          </div>
        ) : (
          <div className="mt-7">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Scope
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Scope v{baseline.version}
                  </h2>

                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
                    {baseline.status}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-muted-foreground">
                  {baseline.status === "APPROVED"
                    ? "This approved scope is locked and acts as the project's reference baseline."
                    : "Review the extracted scope and approve it before using it as the project's reference baseline."}
                </p>
              </div>

              <Link
                href={`/projects/${project.id}/history`}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <History className="size-4" />
                Scope history
              </Link>
            </div>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Scope details</CardTitle>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  Review the structured scope, evidence, and lifecycle
                  information below.
                </p>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                <ScopeReview
                  key={baseline.id}
                  baselineId={baseline.id}
                  status={baseline.status}
                  projectId={project.id}
                  scope={
                    baseline.structuredScope as NormalizedScope
                  }
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}