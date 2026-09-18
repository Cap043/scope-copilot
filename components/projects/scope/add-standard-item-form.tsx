"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import type { AmendmentMeta } from "./scope-types";

/**
 * Add form for standard title/description based sections.
 */
export function AddStandardItemForm({
  saving,
  onCancel,
  onAdd,
}: {
  saving: boolean;
  onCancel: () => void;
  onAdd: (
    item: {
      title: string;
      description?: string;
    },
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedRationale =
      rationale.trim();
    const trimmedReference =
      referenceId.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty.");
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
          title: trimmedTitle,
          description:
            description.trim() || undefined,
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
          : "We couldn't add the item.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="space-y-5">
        <div>
          <p className="font-medium">
            Add scope item
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">
            Title
          </label>

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            disabled={saving}
            placeholder="New deliverable or feature"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            disabled={saving}
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
            {saving ? "Adding..." : "Add item"}
          </Button>
        </div>
      </div>
    </div>
  );
}
