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
  preview: string;
  status: RequestStatus;
  createdLabel: string;
  analyzedAgainstVersion: number;
  asksCount: number;
};

export function RequestCard({
  projectId,
  requestId,
  preview,
  status,
  createdLabel,
  analyzedAgainstVersion,
  asksCount,
}: RequestCardProps) {
  const askLabel =
    asksCount === 1 ? "ask" : "asks";

  return (
    <Link
      href={`/projects/${projectId}/requests/${requestId}`}
      className="group block rounded-xl border border-border bg-background p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: request identity and metadata */}
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="size-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-relaxed">
              {preview}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                Scope v{analyzedAgainstVersion}
              </span>

              <span aria-hidden="true">·</span>

              <span>{createdLabel}</span>

              <span aria-hidden="true">·</span>

              <span>
                {asksCount} {askLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: reserved for future outcome / commercial state */}
        <div className="flex shrink-0 items-start gap-2">
          <div className="hidden text-right sm:block">
            {/* Future:
                Status / Impact / Action
                e.g. Resolved · +$800 · CHARGE
            */}
          </div>

          <ArrowUpRight className="mt-0.5 size-4 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </div>
    </Link>
  );
}