import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ScopeVersionHistory } from "@/components/projects/scope/scope-version-history";
import { ScopeVersionViewer } from "@/components/projects/scope/scope-version-viewer";

import {
  getScopeVersion,
  getScopeVersionHistory,
} from "@/lib/scope-versions";

interface ScopeVersionPageProps {
  params: Promise<{
    projectId: string;
    version: string;
  }>;
}

function statusLabel(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "DRAFT":
      return "Draft";

    default:
      return status;
  }
}

export default async function ScopeVersionPage({
  params,
}: ScopeVersionPageProps) {
  const {
    projectId,
    version: versionParam,
  } = await params;

  const version = Number(versionParam);

  if (
    !Number.isInteger(version) ||
    version < 1
  ) {
    notFound();
  }

  const [versionData, history] =
    await Promise.all([
      getScopeVersion(
        projectId,
        version,
      ).catch(() => null),

      getScopeVersionHistory(
        projectId,
      ),
    ]);

  if (!versionData) {
    notFound();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to project
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">
            Scope history
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Version {versionData.version}
            </h1>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              {statusLabel(
                versionData.status,
              )}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
              <Lock className="size-3" />
              Read only
            </span>
          </div>

          <p className="mt-2 text-muted-foreground">
            This is an immutable snapshot of the
            scope at version {versionData.version}.
          </p>
        </div>

        <div className="mt-8">
          <ScopeVersionHistory
            projectId={projectId}
            versions={history}
            currentVersion={
              versionData.version
            }
          />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              Version details
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Version
                </p>

                <p className="mt-1 text-sm font-medium">
                  v{versionData.version}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium">
                  {statusLabel(
                    versionData.status,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium">
                  {versionData.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Approved
                </p>

                <p className="mt-1 text-sm font-medium">
                  {versionData.approvedAt
                    ? versionData.approvedAt.toLocaleDateString()
                    : "Not approved"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Source type
              </p>

              <p className="mt-1 text-sm font-medium">
                {versionData.sourceType}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <div>
              <CardTitle>
                Original SOW
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                The source text preserved with this
                exact scope version.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {versionData.sourceText}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <div>
              <CardTitle>
                Scope snapshot
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Read-only representation of the
                normalized scope for this version.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <ScopeVersionViewer
              scope={versionData.scope}
            />
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/projects/${projectId}`}
              />
            }
          >
            <ArrowLeft />
            Return to current scope
          </Button>
        </div>
      </div>
    </div>
  );
}