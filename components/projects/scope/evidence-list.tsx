"use client";

import { FileText } from "lucide-react";

import type { SourceReference } from "./scope-types";

/**
 * Evidence is always visible when an item is selected.
 *
 * Evidence is immutable source material from the original SOW,
 * so it should be immediately inspectable without another click.
 */
export function EvidenceList({
  references,
}: {
  references: SourceReference[];
}) {
  if (references.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />

        <h4 className="text-sm font-semibold">
          Source evidence
        </h4>

        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {references.length}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {references.map((reference, index) => (
          <div
            key={`${reference.quote}-${index}`}
            className="rounded-lg border border-border/70 bg-muted/20 p-3.5"
          >
            <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {reference.quote}
            </p>

            {reference.section && (
              <div className="mt-3 border-t border-border/60 pt-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Source section
                </p>

                <p className="mt-0.5 text-xs font-medium text-foreground/80">
                  {reference.section}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}