"use client";

import { ChevronRight } from "lucide-react";

export function ScopeItemRow({
  title,
  description,
  selected,
  wrapTitle = false,
}: {
  title: string;
  description?: string;
  selected: boolean;
  wrapTitle?: boolean;
}) {
  return (
    <div
      className={[
        "group flex items-center gap-3 border-b border-border/70 px-4 py-3 transition-all duration-150 last:border-b-0",
        selected
          ? "bg-primary/5"
          : "hover:bg-muted/35 hover:pl-[18px]",
      ].join(" ")}
    >
      <div
        className={[
          "flex size-7 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
          selected
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary",
        ].join(" ")}
      >
        <ChevronRight
          className={[
            "size-3.5 transition-transform duration-150",
            selected
              ? "translate-x-0.5"
              : "group-hover:translate-x-0.5",
          ].join(" ")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm font-medium transition-colors duration-150",
            wrapTitle
              ? "break-words whitespace-normal leading-relaxed"
              : "truncate",
            selected
              ? "text-foreground"
              : "group-hover:text-foreground",
          ].join(" ")}
        >
          {title}
        </p>

        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success transition-transform duration-150 group-hover:scale-[1.02]">
        Included
      </span>
    </div>
  );
}
