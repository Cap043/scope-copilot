"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import { ChangeMetadata } from "./change-metadata";
import { EvidenceList } from "./evidence-list";
import type { AmendmentMeta, ScopeItem } from "./scope-types";

/**
 * Generic editor for standard scope items.
 */
export function ScopeItemCard({
  item,
  editable,
  saving,
  onSave,
  onRemove,
}: {
  item: ScopeItem;
  editable: boolean;
  saving: boolean;
  onSave: (
    item: ScopeItem,
    meta: AmendmentMeta,
  ) => Promise<void>;
  onRemove: (
    item: ScopeItem,
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(
    item.description ?? "",
  );

  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");

  const [error, setError] = useState("");

  function startEditing() {
    setTitle(item.title);
    setDescription(item.description ?? "");
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
    setTitle(item.title);
    setDescription(item.description ?? "");
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(false);
    setRemoving(false);
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    const trimmedRationale = rationale.trim();
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
      await onSave(
        {
          ...item,
          title: trimmedTitle,
          description:
            description.trim() || undefined,
        },
        {
          rationale: trimmedRationale,
          referenceId: trimmedReference,
        },
      );

      setEditing(false);
      setRationale("");
      setReferenceId("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save the change.",
      );
    }
  }

  async function handleRemove() {
    const trimmedRationale = rationale.trim();
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

    setError("");

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
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't remove the item.",
      );
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        item.status === "removed"
          ? "opacity-60"
          : ""
      }`}
    >
      {item.status === "removed" ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium line-through">
                {item.title}
              </p>

              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-destructive">
                Removed from active scope
              </p>
            </div>
          </div>

          <ChangeMetadata item={item} />

          <EvidenceList
            references={item.sourceReferences}
          />
        </>
      ) : editing ? (
        <div className="space-y-5">
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
            onRationaleChange={
              setRationale
            }
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
              {saving ? "Saving..." : "Save amendment"}
            </Button>
          </div>
        </div>
      ) : removing ? (
        <div className="space-y-5">
          <div>
            <p className="font-medium">
              Remove "{item.title}"?
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The item will remain in the version history
              as a tombstone.
            </p>
          </div>

          <AmendmentFields
            rationale={rationale}
            referenceId={referenceId}
            disabled={saving}
            onRationaleChange={
              setRationale
            }
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
                {item.title}
              </p>

              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}

              <ChangeMetadata item={item} />
            </div>

            {editable && (
              <div className="flex shrink-0 gap-1">
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
