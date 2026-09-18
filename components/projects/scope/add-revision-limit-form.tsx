"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import type { AmendmentMeta } from "./scope-types";

/**
 * Add form for revision limits.
 */
export function AddRevisionLimitForm({
  saving,
  onCancel,
  onAdd,
}: {
  saving: boolean;
  onCancel: () => void;
  onAdd: (
    item: {
      type: string;
      limit: string;
    },
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [type, setType] = useState("");
  const [limit, setLimit] =
    useState("");
  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmedType = type.trim();
    const trimmedLimit = limit.trim();
    const trimmedRationale =
      rationale.trim();
    const trimmedReference =
      referenceId.trim();

    if (!trimmedType || !trimmedLimit) {
      setError(
        "Type and limit cannot be empty.",
      );
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
          type: trimmedType,
          limit: trimmedLimit,
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
          : "We couldn't add the revision limit.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="space-y-5">
        <p className="font-medium">
          Add revision limit
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              Type
            </label>

            <input
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              disabled={saving}
              placeholder="Design revisions"
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Limit
            </label>

            <input
              value={limit}
              onChange={(event) =>
                setLimit(event.target.value)
              }
              disabled={saving}
              placeholder="2 rounds"
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
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
            {saving ? "Adding..." : "Add limit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
