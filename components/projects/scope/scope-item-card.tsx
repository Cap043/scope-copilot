"use client";

import { useState } from "react";
import {
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import { ChangeMetadata } from "./change-metadata";
import { EvidenceList } from "./evidence-list";
import type {
  AmendmentMeta,
  ScopeItem,
} from "./scope-types";

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

  if (item.status === "removed") {
    return (
      <div className="px-4 py-3 opacity-60 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium line-through">
              {item.title}
            </p>

            {item.description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}

            <p className="mt-1.5 text-[11px] font-medium text-destructive">
              Removed from active scope
            </p>

            <ChangeMetadata item={item} />

            <EvidenceList
              references={item.sourceReferences}
            />
          </div>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-4 sm:p-5">
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
              className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
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
              className="mt-2 min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
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

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              disabled={
                saving || !title.trim()
              }
            >
              <Check />
              {saving
                ? "Saving..."
                : "Save amendment"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (removing) {
    return (
      <div className="bg-destructive/5 p-4 sm:p-5">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold">
              Remove this item?
            </p>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The item will remain in this version's history.
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

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
      </div>
    );
  }

  return (
    <div className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {item.title}
          </p>

          {item.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          <ChangeMetadata item={item} />

          <EvidenceList
            references={item.sourceReferences}
          />
        </div>

        {editable && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={startEditing}
              disabled={saving}
              aria-label={`Edit ${item.title}`}
              title="Edit"
            >
              <Pencil />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={startRemoving}
              disabled={saving}
              aria-label={`Remove ${item.title}`}
              title="Remove"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}