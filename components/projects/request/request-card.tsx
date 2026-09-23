import Link from "next/link";
import {
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";

import { RequestStatusBadge } from "./request-status-badge";
import type { RequestStatus } from "./request-status-badge";

type RequestCardProps = {
  projectId: string;
  requestId: string;
  title: string;
  preview: string;
  status: RequestStatus;
  createdLabel: string;
  analyzedAgainstVersion: number;
};

export function RequestCard({
  projectId,
  requestId,
  title,
  preview,
  status,
  createdLabel,
  analyzedAgainstVersion,
}: RequestCardProps) {
  return (
    <Link
      href={`/projects/${projectId}/requests/${requestId}`}
      className="group block rounded-xl border border-border bg-background p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="size-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">
                {title}
              </h3>

              <RequestStatusBadge status={status} />
            </div>

            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {preview}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                Scope v{analyzedAgainstVersion}
              </span>

              <span aria-hidden="true">·</span>

              <span>{createdLabel}</span>
            </div>
          </div>
        </div>

        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}