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
    <header className="shrink-0 border-b border-border/70 pb-3">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Projects
      </Link>

     <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              {projectName}
            </h1>

            {status && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {status}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 text-xs text-muted-foreground">
            <span>{clientName}</span>

            <span className="text-border">•</span>

            <span>
              {formatCurrency(value)}
            </span>
          </div>
        </div>

        {showRequestAction && (
          <Button
            size="sm"
           className="w-full sm:w-auto"
            nativeButton={false}
            render={
              <Link
                href={`/projects/${projectId}/requests/new`}
              />
            }
          >
            <Plus className="size-3.5" />
            New Client Request
          </Button>
        )}
      </div>
    </header>
  );
}