"use client";

import type { Assumption, RevisionLimit, ScopeItem } from "./scope-types";

/**
 * Displays amendment/removal history without making it editable.
 */
export function ChangeMetadata({
  item,
}: {
  item: ScopeItem | RevisionLimit | Assumption;
}) {
  return (
    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
      {item.provenance.type === "manual_amendment" ? (
        <p>
          Added manually — {item.provenance.rationale}
        </p>
      ) : item.amendment ? (
        <p>
          Amended — {item.amendment.rationale}
        </p>
      ) : null}

      {item.removal && (
        <p>
          Removed — {item.removal.rationale}
        </p>
      )}
    </div>
  );
}
