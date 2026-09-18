"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import { ChangeMetadata } from "./change-metadata";
import { EvidenceList } from "./evidence-list";
import type { AmendmentMeta, RevisionLimit } from "./scope-types";

/**
 * Revision limit editor.
 */
export function RevisionLimitCard({
  item,
  editable,
  saving,
  onSave,
  onRemove,
}: {
  item: RevisionLimit;
  editable: boolean;
  saving: boolean;
  onSave: (
    item: RevisionLimit,
    meta: AmendmentMeta,
  ) => Promise<void>;
  onRemove: (
    item: RevisionLimit,
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [type, setType] = useState(item.type);
  const [limit, setLimit] = useState(item.limit);

  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  function startEditing() {
    setType(item.type);
    setLimit(item.limit);
    setRationale("");
    setReferenceId("");
    setError("");
    setRemoving(false);
    setEditing(true);
  }

  function startRemoving() {
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(false);
    setRemoving(true);
  }

  function cancelAction() {
    setType(item.type);
    setLimit(item.limit);
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(false);
    setRemoving(false);
  }

  async function handleSave() {
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

    try {
      await onSave(
        {
          ...item,
          type: trimmedType,
          limit: trimmedLimit,
        },
        {
          rationale: trimmedRationale,
          referenceId: trimmedReference,
        },
      );

      setEditing(false);
      setRationale("");
      setReferenceId("");
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save the change.",
      );
    }
  }

  async function handleRemove() {
    const trimmedRationale =
      rationale.trim();
    const trimmedReference =
      referenceId.trim();

    if (!trimmedRationale) {
      setError("Removal reason is required.");
      return;
    }

    if (!trimmedReference) {
      setError("Removal reference is required.");
      return;
    }

    try {
      await onRemove(
        item,
        {
          rationale: trimmedRationale,
          referenceId: trimmedReference,
        },
      );

      setRemoving(false);
      setRationale("");
      setReferenceId("");
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't remove the revision limit.",
      );
    }
  }

  if (item.status === "removed") {
    return (
      <div className="rounded-lg border p-4 opacity-60">
        <p className="font-medium line-through">
          {item.type}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {item.limit}
        </p>

        <p className="mt-2 text-xs font-medium text-destructive">
          Removed from active scope
        </p>

        <ChangeMetadata item={item} />

        <EvidenceList
          references={item.sourceReferences}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      {editing ? (
        <div className="space-y-5">
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
              onClick={cancelAction}
              disabled={saving}
            >
              <X />
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              <Check />
              {saving
                ? "Saving..."
                : "Save amendment"}
            </Button>
          </div>
        </div>
      ) : removing ? (
        <div className="space-y-5">
          <div>
            <p className="font-medium">
              Remove "{item.type}"?
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The item stays in version history as a tombstone.
            </p>
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
              onClick={cancelAction}
              disabled={saving}
            >
              <X />
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={saving}
            >
              <Trash2 />
              {saving
                ? "Removing..."
                : "Remove item"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">
                {item.type}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.limit}
              </p>

              <ChangeMetadata item={item} />
            </div>

            {editable && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startEditing}
                  disabled={saving}
                >
                  <Pencil />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startRemoving}
                  disabled={saving}
                >
                  <Trash2 />
                  Remove
                </Button>
              </div>
            )}
          </div>

          <EvidenceList
            references={item.sourceReferences}
          />
        </>
      )}
    </div>
  );
}
