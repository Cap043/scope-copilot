"use client";

import type { ReactNode } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers3,
  ListChecks,
  Users,
  XCircle,
} from "lucide-react";

import type {
  ReviewScope,
  SectionKey,
} from "./types";
import {
  getActiveScopeItems,
  getEvidenceCount,
} from "./utils";

function SummaryMetric({
  label,
  value,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>

      <p className="mt-1 text-sm font-semibold tracking-tight">
        {value}
      </p>
    </>
  );

  if (!onClick) {
    return (
      <div className="min-w-[112px] border-r border-border px-3 py-2.5 last:border-r-0 sm:min-w-[128px] sm:px-4 xl:min-w-0">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-0 border-r border-border px-3 py-2.5 text-left transition-colors duration-150 last:border-r-0 hover:bg-muted/40 sm:px-4",
        active ? "bg-primary/5" : "",
      ].join(" ")}
    >
      {content}
    </button>
  );
}

export function ScopeSummary({
  reviewScope,
  activeSection,
  onSelectSection,
}: {
  reviewScope: ReviewScope;
  activeSection: SectionKey;
  onSelectSection: (
    section: SectionKey,
  ) => void;
}) {
  const activeItems = getActiveScopeItems(reviewScope);
  const evidenceCount = getEvidenceCount(reviewScope);

  return (
    <section className="shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-card">
      <div className="flex min-w-max divide-x divide-border xl:grid xl:min-w-0 xl:grid-cols-8">
        <SummaryMetric
          label="Deliverables"
          value={activeItems.deliverables.length}
          icon={<Layers3 className="size-3" />}
          active={activeSection === "deliverables"}
          onClick={() => onSelectSection("deliverables")}
        />

        <SummaryMetric
          label="Features"
          value={activeItems.features.length}
          icon={<ListChecks className="size-3" />}
          active={activeSection === "features"}
          onClick={() => onSelectSection("features")}
        />

        <SummaryMetric
          label="Exclusions"
          value={activeItems.exclusions.length}
          icon={<XCircle className="size-3" />}
          active={activeSection === "exclusions"}
          onClick={() => onSelectSection("exclusions")}
        />

        <SummaryMetric
          label="Responsibilities"
          value={
            activeItems.clientResponsibilities.length
          }
          icon={<Users className="size-3" />}
          active={
            activeSection === "clientResponsibilities"
          }
          onClick={() =>
            onSelectSection("clientResponsibilities")
          }
        />

        <SummaryMetric
          label="Revision limits"
          value={activeItems.revisionLimits.length}
          icon={<ClipboardList className="size-3" />}
          active={activeSection === "revisionLimits"}
          onClick={() => onSelectSection("revisionLimits")}
        />

        <SummaryMetric
          label="Timeline"
          value={reviewScope.timeline.duration ?? "—"}
          icon={<CalendarDays className="size-3" />}
          active={activeSection === "timeline"}
          onClick={() => onSelectSection("timeline")}
        />

        <SummaryMetric
          label="Assumptions"
          value={activeItems.assumptions.length}
          icon={<CheckCircle2 className="size-3" />}
          active={activeSection === "assumptions"}
          onClick={() => onSelectSection("assumptions")}
        />

        <SummaryMetric
          label="Evidence"
          value={evidenceCount}
          icon={<FileText className="size-3" />}
        />
      </div>
    </section>
  );
}
