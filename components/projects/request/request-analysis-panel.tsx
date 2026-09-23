import {
  CircleHelp,
  Clock3,
  FileSearch,
  GitCompareArrows,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RequestAnalysisPanelProps = {
  hasScopeBaseline: boolean;
};

export function RequestAnalysisPanel({
  hasScopeBaseline,
}: RequestAnalysisPanelProps) {
  return (
    <Card>
      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <FileSearch className="size-4 text-muted-foreground" />
          <CardTitle>How this request will be evaluated</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="space-y-4">
          <AnalysisStep
            icon={GitCompareArrows}
            title="Compare with approved scope"
            description="Check whether the requested work is already covered by the project's agreed scope."
            state={hasScopeBaseline ? "ready" : "blocked"}
          />

          <AnalysisStep
            icon={ShieldCheck}
            title="Identify affected scope"
            description="Connect the request to the specific scope items, exclusions, assumptions, or limits it touches."
            state={hasScopeBaseline ? "ready" : "blocked"}
          />

          <AnalysisStep
            icon={Clock3}
            title="Estimate effort and commercial impact"
            description="Estimate additional work, internal cost, timeline impact, and the resulting margin effect."
            state="upcoming"
          />

          <AnalysisStep
            icon={CircleHelp}
            title="Recommend the next action"
            description="Surface an evidence-backed recommendation such as absorb, charge, swap, or defer."
            state="upcoming"
          />
        </div>

        {!hasScopeBaseline && (
          <div className="mt-5 rounded-lg border border-warning/15 bg-warning/5 p-3.5">
            <p className="text-sm font-medium">
              A scope baseline is required before analysis.
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Define and approve the project scope first so this request has a
              trusted reference point.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisStep({
  icon: Icon,
  title,
  description,
  state,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  state: "ready" | "blocked" | "upcoming";
}) {
  const iconClassName =
    state === "ready"
      ? "bg-success/10 text-success"
      : state === "blocked"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
