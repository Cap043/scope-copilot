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
    <header className="shrink-0 border-b border-border/70 pb-2.5">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Scope Copilot
        </Link>

        {showRequestAction && (
          <Button
            size="sm"
            className="h-8 shrink-0"
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

      <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="min-w-0 break-words text-lg font-semibold tracking-[-0.03em] sm:text-xl">
          {projectName}
        </h1>

        {status && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {status}
          </span>
        )}

        <span className="hidden text-border sm:inline">
          •
        </span>

        <span className="text-xs text-muted-foreground">
          {clientName}
        </span>

        <span className="hidden text-border sm:inline">
          •
        </span>

        <span className="text-xs font-medium text-muted-foreground">
          Cap {formatCurrency(value)}
        </span>
      </div>
    </header>
  );
}