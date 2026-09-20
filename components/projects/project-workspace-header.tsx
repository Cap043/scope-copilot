import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProjectWorkspaceHeaderProps = {
  projectId: string;
  projectName: string;
  clientName: string;
  value: unknown;
  status?: string | null;
  showRequestAction?: boolean;
};

function formatCurrency(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function ProjectWorkspaceHeader({
  projectId,
  projectName,
  clientName,
  value,
  status,
  showRequestAction = true,
}: ProjectWorkspaceHeaderProps) {
  return (
    <header className="border-b border-border/70 pb-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Projects
      </Link>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {projectName}
            </h1>

            {status && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {status}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{clientName}</span>

            <span className="text-border">•</span>

            <span>
              <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground/80">
                Value
              </span>

              <span className="font-medium text-foreground">
                {formatCurrency(value)}
              </span>
            </span>
          </div>
        </div>

        {showRequestAction && (
          <Button
            size="sm"
            className="w-full lg:w-auto"
            nativeButton={false}
            render={
              <Link
                href={`/projects/${projectId}/requests/new`}
              />
            }
          >
            <Plus className="size-4" />
            New Client Request
          </Button>
        )}
      </div>
    </header>
  );
}