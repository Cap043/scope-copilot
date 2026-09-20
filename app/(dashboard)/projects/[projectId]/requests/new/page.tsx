import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
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

import { Label } from "@/components/ui/label";

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
          {/* Breadcrumb */}
          <Link
            href={`/projects/${project.id}/requests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Client requests
          </Link>

          {/* Page heading */}
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

          {/* Main request workspace */}
          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.85fr)]">
            {/* Request input */}
            <Card>
              <CardHeader className="border-b px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MessageSquare className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <CardTitle>Client request</CardTitle>

                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Include the client's wording and enough context for
                      the analysis to be useful.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="request">
                    Request details
                  </Label>

                  <textarea
                    id="request"
                    readOnly
                    placeholder="Example: Can you also add downloadable monthly reports to the dashboard?"
                    className="min-h-64 w-full resize-y rounded-lg border border-input bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />

                  <p className="text-xs text-muted-foreground">
                    The original request will remain separate from the
                    approved scope and can be analyzed against it later.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Request analysis will be connected in the next product
                    phase.
                  </p>

                  <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted px-3.5 text-sm font-medium text-muted-foreground">
                    Analyze request
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis reference */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="border-b px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />

                    <CardTitle>Analysis reference</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  {baseline ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-success/15 bg-success/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                            <CheckCircle2 className="size-4 text-success" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              Scope v{baseline.version}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {baseline.status === "APPROVED"
                                ? "Approved baseline"
                                : "Current scope draft"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                          What will be evaluated
                        </p>

                        <div className="mt-3 space-y-2.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="size-1.5 rounded-full bg-primary" />
                            Scope coverage
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="size-1.5 rounded-full bg-primary" />
                            Related scope items
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="size-1.5 rounded-full bg-primary" />
                            Commercial impact
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/projects/${project.id}/scope`}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Review approved scope
                        <ArrowLeft className="ml-1 size-3.5 rotate-180" />
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4">
                      <p className="text-sm font-medium">
                        No scope baseline yet
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Define the project scope before analyzing client
                        requests against it.
                      </p>

                      <Link
                        href={`/projects/${project.id}/scope`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        Define scope
                        <ArrowLeft className="size-3.5 rotate-180" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="rounded-xl border border-ai/15 bg-ai/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ai/10">
                    <Sparkles className="size-4 text-ai" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      How Scope Copilot will help
                    </p>

                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      The eventual analysis will connect the client's words
                      to the approved scope, explain what changed, and
                      surface the commercial consequences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}