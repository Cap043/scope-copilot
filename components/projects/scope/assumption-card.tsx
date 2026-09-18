"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import { ChangeMetadata } from "./change-metadata";
import { EvidenceList } from "./evidence-list";
import type { AmendmentMeta, Assumption } from "./scope-types";

/**
 * Assumption editor.
 */
export function AssumptionCard({
  item,
  editable,
  saving,
  onSave,
  onRemove,
}: {
  item: Assumption;
  editable: boolean;
  saving: boolean;
  onSave: (
    item: Assumption,
    meta: AmendmentMeta,
  ) => Promise<void>;
  onRemove: (
    item: Assumption,
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [editing, setEditing] =
    useState(false);
  const [removing, setRemoving] =
    useState(false);

  const [statement, setStatement] =
    useState(item.statement);

  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  function startEditing() {
    setStatement(item.statement);
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
    setStatement(item.statement);
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(false);
    setRemoving(false);
  }

  async function handleSave() {
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

    try {
      await onSave(
        {
          ...item,
          statement: trimmedStatement,
        },
        {
          rationale:
            trimmedRationale,
          referenceId:
            trimmedReference,
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
          : "We couldn't save the assumption.",
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
          rationale:
            trimmedRationale,
          referenceId:
            trimmedReference,
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
          : "We couldn't remove the assumption.",
      );
    }
  }

  if (item.status === "removed") {
    return (
      <div className="rounded-lg border p-4 opacity-60">
        <p className="text-sm line-through">
          {item.statement}
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
          <div>
            <label className="text-sm font-medium">
              Statement
            </label>

            <textarea
              value={statement}
              onChange={(event) =>
                setStatement(
                  event.target.value,
                )
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
              Remove this assumption?
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
            <p className="text-sm">
              {item.statement}
            </p>

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

          <ChangeMetadata item={item} />

          <EvidenceList
            references={item.sourceReferences}
          />
        </>
      )}
    </div>
  );
}
