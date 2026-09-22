"use client";

import type { ReactNode } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Layers3,
  ListChecks,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import type {
  ReviewScope,
  SectionKey,
} from "./types";
import { getActiveScopeItems } from "./utils";

function OverviewSectionRow({
  title,
  description,
  count,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  count: number | string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b border-border/70 px-4 py-3.5 text-left transition-all duration-150 last:border-b-0 hover:bg-muted/30"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-150 group-hover:translate-x-0.5 group-hover:bg-primary/10 group-hover:text-primary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium transition-colors group-hover:text-foreground">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        {count}
      </span>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}

export function ScopeOverview({
  reviewScope,
  onSelectSection,
}: {
  reviewScope: ReviewScope;
  onSelectSection: (section: SectionKey) => void;
}) {
  const activeItems = getActiveScopeItems(reviewScope);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="rounded-xl border border-dashed bg-muted/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Scope at a glance
            </p>

            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              This baseline is the reference point for evaluating
              future client requests. Choose a scope area below to
              inspect its actual items.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <OverviewSectionRow
          title="Deliverables"
          description="Main outputs included in the project."
          count={activeItems.deliverables.length}
          icon={<Layers3 className="size-4" />}
          onClick={() => onSelectSection("deliverables")}
        />

        <OverviewSectionRow
          title="Features"
          description="Specific functionality included in the scope."
          count={activeItems.features.length}
          icon={<ListChecks className="size-4" />}
          onClick={() => onSelectSection("features")}
        />

        <OverviewSectionRow
          title="Exclusions"
          description="Explicit boundaries on what is not included."
          count={activeItems.exclusions.length}
          icon={<XCircle className="size-4" />}
          onClick={() => onSelectSection("exclusions")}
        />

        <OverviewSectionRow
          title="Client Responsibilities"
          description="Inputs and actions owned by the client."
          count={activeItems.clientResponsibilities.length}
          icon={<Users className="size-4" />}
          onClick={() =>
            onSelectSection("clientResponsibilities")
          }
        />

        <OverviewSectionRow
          title="Revision Limits"
          description="Defined limits around included revisions."
          count={activeItems.revisionLimits.length}
          icon={<ClipboardList className="size-4" />}
          onClick={() => onSelectSection("revisionLimits")}
        />

        <OverviewSectionRow
          title="Timeline"
          description="Duration, start condition, and dependencies."
          count="1"
          icon={<CalendarDays className="size-4" />}
          onClick={() => onSelectSection("timeline")}
        />

        <OverviewSectionRow
          title="Assumptions"
          description="Conditions that define the scope boundary."
          count={activeItems.assumptions.length}
          icon={<CheckCircle2 className="size-4" />}
          onClick={() => onSelectSection("assumptions")}
        />
      </div>
    </div>
  );
}
