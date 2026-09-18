"use client";

/**
 * Every manual amendment needs a human-readable reason and reference.
 *
 * This is deliberately collected in the UI rather than letting the
 * server infer why a scope change happened.
 */
export function AmendmentFields({
  rationale,
  referenceId,
  disabled,
  onRationaleChange,
  onReferenceChange,
}: {
  rationale: string;
  referenceId: string;
  disabled: boolean;
  onRationaleChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium">
          Reason
        </label>

        <textarea
          value={rationale}
          onChange={(event) =>
            onRationaleChange(event.target.value)
          }
          disabled={disabled}
          placeholder="Why was this change agreed?"
          className="mt-2 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Reference
        </label>

        <input
          value={referenceId}
          onChange={(event) =>
            onReferenceChange(event.target.value)
          }
          disabled={disabled}
          placeholder="Client email, meeting, request reference..."
          className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
