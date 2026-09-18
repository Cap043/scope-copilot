"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import type { AmendmentMeta } from "./scope-types";

/**
 * Add form for assumptions.
 */
export function AddAssumptionForm({
  saving,
  onCancel,
  onAdd,
}: {
  saving: boolean;
  onCancel: () => void;
  onAdd: (
    item: {
      statement: string;
    },
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [statement, setStatement] =
    useState("");
  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmedStatement =
      statement.trim();
    const trimmedRationale =
      rationale.trim();
    const trimmedReference =
      referenceId.trim();

    if (!trimmedStatement) {
      setError("Statement is required.");
      return;
    }

    if (!trimmedRationale) {
      setError("Reason is required.");
      return;
    }

    if (!trimmedReference) {
      setError("Reference is required.");
      return;
    }

    setError("");

    try {
      await onAdd(
        {
          statement: trimmedStatement,
        },
        {
          rationale: trimmedRationale,
          referenceId: trimmedReference,
        },
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't add the assumption.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="space-y-5">
        <p className="font-medium">
          Add assumption
        </p>

        <div>
          <label className="text-sm font-medium">
            Statement
          </label>

          <textarea
            value={statement}
            onChange={(event) =>
              setStatement(event.target.value)
            }
            disabled={saving}
            placeholder="New agreed project assumption"
            className="mt-2 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <AmendmentFields
          rationale={rationale}
          referenceId={referenceId}
          disabled={saving}
          onRationaleChange={setRationale}
          onReferenceChange={
            setReferenceId
          }
        />

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Plus />
            {saving
              ? "Adding..."
              : "Add assumption"}
          </Button>
        </div>
      </div>
    </div>
  );
}
