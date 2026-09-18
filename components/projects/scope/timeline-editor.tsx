"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AmendmentFields } from "./amendment-fields";
import { EvidenceList } from "./evidence-list";
import type { AmendmentMeta, Timeline } from "./scope-types";

/**
 * Timeline editor.
 *
 * Timeline does not have an item ID because it is a singleton.
 */
export function TimelineEditor({
  timeline,
  editable,
  saving,
  onSave,
}: {
  timeline: Timeline;
  editable: boolean;
  saving: boolean;
  onSave: (
    timeline: Timeline,
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [editing, setEditing] =
    useState(false);

  const [duration, setDuration] =
    useState(timeline.duration ?? "");
  const [startCondition, setStartCondition] =
    useState(
      timeline.startCondition ?? "",
    );
  const [dependencies, setDependencies] =
    useState(
      timeline.dependencies.join("\n"),
    );

  const [rationale, setRationale] =
    useState("");
  const [referenceId, setReferenceId] =
    useState("");
  const [error, setError] = useState("");

  function startEditing() {
    setDuration(timeline.duration ?? "");
    setStartCondition(
      timeline.startCondition ?? "",
    );
    setDependencies(
      timeline.dependencies.join("\n"),
    );
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setDuration(timeline.duration ?? "");
    setStartCondition(
      timeline.startCondition ?? "",
    );
    setDependencies(
      timeline.dependencies.join("\n"),
    );
    setRationale("");
    setReferenceId("");
    setError("");
    setEditing(false);
  }

  async function handleSave() {
    const updatedTimeline: Timeline = {
      ...timeline,
      duration:
        duration.trim() || undefined,
      startCondition:
        startCondition.trim() || undefined,
      dependencies: dependencies
        .split("\n")
        .map((dependency) =>
          dependency.trim(),
        )
        .filter(Boolean),
    };

    if (
      !updatedTimeline.duration &&
      !updatedTimeline.startCondition &&
      updatedTimeline.dependencies.length === 0
    ) {
      setError(
        "Timeline must contain at least one value.",
      );
      return;
    }

    const trimmedRationale =
      rationale.trim();
    const trimmedReference =
      referenceId.trim();

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
        updatedTimeline,
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
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save the timeline.",
      );
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">
          Timeline
        </h3>

        {editable && !editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startEditing}
            disabled={saving}
          >
            <Pencil />
            Edit
          </Button>
        )}
      </div>

      <div className="mt-3 rounded-lg border p-4">
        {editing ? (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">
                Duration
              </label>

              <input
                value={duration}
                onChange={(event) =>
                  setDuration(
                    event.target.value,
                  )
                }
                disabled={saving}
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Start condition
              </label>

              <input
                value={startCondition}
                onChange={(event) =>
                  setStartCondition(
                    event.target.value,
                  )
                }
                disabled={saving}
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Dependencies
              </label>

              <textarea
                value={dependencies}
                onChange={(event) =>
                  setDependencies(
                    event.target.value,
                  )
                }
                disabled={saving}
                placeholder="One dependency per line"
                className="mt-2 min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                onClick={cancelEditing}
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
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                {timeline.duration && (
                  <p className="text-sm">
                    <span className="font-medium">
                      Duration:
                    </span>{" "}
                    {timeline.duration}
                  </p>
                )}

                {timeline.startCondition && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">
                      Starts:
                    </span>{" "}
                    {timeline.startCondition}
                  </p>
                )}

                {timeline.dependencies.length >
                  0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">
                      Dependencies
                    </p>

                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {timeline.dependencies.map(
                        (
                          dependency,
                          index,
                        ) => (
                          <li
                            key={`${dependency}-${index}`}
                          >
                            {dependency}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                {timeline.provenance?.type ===
                  "manual_amendment" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Manually amended —{" "}
                    {
                      timeline.provenance
                        .rationale
                    }
                  </p>
                )}

                {timeline.provenance?.type ===
                  "document_extraction" &&
                  timeline.amendment && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Amended —{" "}
                    {
                      timeline.amendment
                        .rationale
                    }
                  </p>
                )}
              </div>
            </div>

            <EvidenceList
              references={
                timeline.sourceReferences
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
