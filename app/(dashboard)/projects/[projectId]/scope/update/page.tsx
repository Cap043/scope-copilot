import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScopeUpdateForm } from "@/components/projects/scope/scope-update-form";
import { ScopeRevisionReview } from "@/components/projects/scope/scope-revision-review";

import { getScopeUpdateContext } from "@/lib/scope-revision";
import { getScopeRevisionReview } from "@/lib/scope-revision-review";

interface ScopeUpdatePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ScopeUpdatePage({
  params,
}: ScopeUpdatePageProps) {
  const { projectId } = await params;

  const context = await getScopeUpdateContext(projectId);

  // Load the review model only when a pending candidate exists.
  const review = context.candidate
    ? await getScopeRevisionReview(context.candidate.id)
    : null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href={`/projects/${projectId}`} />
          }
        >
          <ArrowLeft />
          Back to project
        </Button>

        <div className="mt-8">
          <p className="text-sm font-medium text-muted-foreground">
            {context.project.name}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Update project scope
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Provide the revised SOW. We will extract it first,
            then compare it against the currently approved scope.
          </p>
        </div>

        <div className="mt-8 rounded-lg border p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Current approved scope
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Version {context.baseBaseline.version}
              </p>
            </div>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              APPROVED
            </span>
          </div>
        </div>

        {context.candidate && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border p-5">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div>
              <p className="font-medium">
                A revised SOW is pending review
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Candidate {context.candidate.id} was created on{" "}
                {context.candidate.createdAt.toLocaleString()}.
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Review the detected scope changes below before
                creating the next approved scope version.
              </p>
            </div>
          </div>
        )}

        {review && (
          <div className="mt-8">
            <ScopeRevisionReview review={review} />
          </div>
        )}

        {!review && (
          <div className="mt-8 rounded-xl border p-6">
            <ScopeUpdateForm
              projectId={projectId}
              baseVersion={context.baseBaseline.version}
            />
          </div>
        )}
      </div>
    </div>
  );
}