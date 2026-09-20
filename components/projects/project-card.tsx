import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    value: unknown;
    targetEndDate: Date | null;
    client: {
      name: string;
    };
  };
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

function formatDate(date: Date | null) {
  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({
  project,
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block h-full"
    >
      <Card className="h-full border-border/80 transition-all duration-150 hover:-translate-y-px hover:border-border hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          {/* Project identity */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                {project.name}
              </h2>

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {project.client.name}
              </p>
            </div>

            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
              <ArrowUpRight className="size-4" />
            </div>
          </div>

          {/* Project metadata */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CircleDollarSign className="size-3.5" />
                <span>Project value</span>
              </div>

              <p className="mt-1.5 text-lg font-semibold tracking-tight">
                {formatCurrency(project.value)}
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>Target end</span>
              </div>

              <p className="mt-1.5 truncate text-sm font-medium">
                {formatDate(project.targetEndDate)}
              </p>
            </div>
          </div>

          {/* Footer affordance */}
          <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
            <span>Open project</span>

            <span className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}