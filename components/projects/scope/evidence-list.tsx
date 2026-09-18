"use client";

import type { SourceReference } from "./scope-types";

/**
 * Evidence always comes from the original SOW.
 *
 * It is intentionally read-only so amendments cannot silently
 * rewrite the original evidence trail.
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
    <div className="mt-3 space-y-2">
      {references.map((reference, index) => (
        <div
          key={`${reference.quote}-${index}`}
          className="rounded-md bg-muted/50 p-3"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Evidence
          </p>

          <p className="mt-1 whitespace-pre-wrap font-mono text-xs">
            {reference.quote}
          </p>

          {reference.section && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {reference.section}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
