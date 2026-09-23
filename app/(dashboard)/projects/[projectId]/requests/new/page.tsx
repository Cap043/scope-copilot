import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { getProject } from "@/lib/projects";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { RequestAnalysisPanel } from "@/components/projects/request/request-analysis-panel";
import { RequestForm } from "@/components/projects/request/request-form";

interface NewRequestPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function NewRequestPage({
  params,
}: NewRequestPageProps) {
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
            className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </div>
      </div>
    );
  }

  const baseline = project.scopeBaselines[0];
  const hasApprovedScope =
    baseline?.status === "APPROVED";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
        <ProjectWorkspaceHeader
          projectId={project.id}
          projectName={project.name}
          clientName={project.client.name}
          value={project.value}
          status="Active"
          showRequestAction={false}
        />

        <ProjectWorkspaceNav
          projectId={project.id}
        />

        <div className="mt-7">
          <Link
            href={`/projects/${project.id}/requests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Client requests
          </Link>

          <div className="mt-4 max-w-3xl">
            <div className="flex items-center gap-2 text-ai">
              <Sparkles className="size-4" />

              <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                New client request
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Capture the client&apos;s request
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Paste the request exactly as you received it. Scope Copilot
              will use the approved project scope as the reference for
              evaluating what changed.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.85fr)]">
            <RequestForm
              projectId={project.id}
              hasScopeBaseline={hasApprovedScope}
            />

            <RequestAnalysisPanel
              hasScopeBaseline={hasApprovedScope}
            />
          </div>
        </div>
      </div>
    </div>
  );
}