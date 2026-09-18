"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus } from "lucide-react";

import {
  approveScopeBaselineAction,
  createScopeVersionAction,
  updateScopeBaselineAction,
} from "@/app/(dashboard)/projects/[projectId]/actions";
import { Button } from "@/components/ui/button";
import type { NormalizedScope } from "@/lib/scope-schema";

type ScopeReviewProps = {
  projectId: string;
  baselineId: string;
  status: string;
  scope: NormalizedScope;
};

type SourceReference = {
  quote: string;
  section?: string;
};

type ScopeItem =
  NormalizedScope["deliverables"][number];

type RevisionLimit =
  NormalizedScope["revisionLimits"][number];

type Timeline = NormalizedScope["timeline"];

type Assumption =
  NormalizedScope["assumptions"][number];
/**
 * Evidence always comes from the original SOW.
 *
 * It is intentionally read-only so editing extracted fields
 * cannot silently change the evidence trail.
 */
function EvidenceList({
  references,
}: {
  references: SourceReference[];
}) {
  if (references.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {references.map((reference, index) => (
        <div
          key={`${reference.quote}-${index}`}
          className="rounded-md bg-muted/50 p-3"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Evidence
          </p>

          <p className="mt-1 whitespace-pre-wrap font-mono text-xs">
            {reference.quote}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Generic editor for deliverables, features, exclusions,
 * and client responsibilities.
 */
function ScopeItemCard({
  item,
  editable,
  saving,
  onSave,
}: {
  item: ScopeItem;
  editable: boolean;
  saving: boolean;
  onSave: (item: ScopeItem) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(
    item.description ?? "",
  );
  const [error, setError] = useState("");

  function startEditing() {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setError("");
    setEditing(false);
  }

  async function handleSave() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty.");
      return;
    }

    setError("");

    try {
      await onSave({
        ...item,
        title: trimmedTitle,
        description: description.trim() || undefined,
      });

      setEditing(false);
    } catch {
      // Keep the editor open so the user does not lose their changes.
    }
  }

  return (
    <div className="rounded-lg border p-4">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`scope-title-${item.title}`}
              className="text-sm font-medium"
            >
              Title
            </label>

            <input
              id={`scope-title-${item.title}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor={`scope-description-${item.title}`}
              className="text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id={`scope-description-${item.title}`}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              disabled={saving}
              className="mt-2 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{item.title}</p>

              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>

            {editable && (
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
            )}
          </div>

          <EvidenceList references={item.sourceReferences} />
        </>
      )}
    </div>
  );
}

function ScopeItemList({
  title,
  items,
  editable,
  savingSection,
  onItemSave,
}: {
  title: string;
  items: ScopeItem[];
  editable: boolean;
  savingSection: boolean;
  onItemSave: (index: number, item: ScopeItem) => Promise<void>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>

      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <ScopeItemCard
            key={`${item.title}-${index}`}
            item={item}
            editable={editable}
            saving={savingSection}
            onSave={(updatedItem) =>
              onItemSave(index, updatedItem)
            }
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Revision-limit editor.
 */
function RevisionLimitCard({
  item,
  editable,
  saving,
  onSave,
}: {
  item: RevisionLimit;
  editable: boolean;
  saving: boolean;
  onSave: (item: RevisionLimit) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(item.type);
  const [limit, setLimit] = useState(item.limit);
  const [error, setError] = useState("");

  function startEditing() {
    setType(item.type);
    setLimit(item.limit);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setType(item.type);
    setLimit(item.limit);
    setError("");
    setEditing(false);
  }

  async function handleSave() {
    const trimmedType = type.trim();
    const trimmedLimit = limit.trim();

    if (!trimmedType || !trimmedLimit) {
      setError("Type and limit cannot be empty.");
      return;
    }

    setError("");

    try {
      await onSave({
        ...item,
        type: trimmedType,
        limit: trimmedLimit,
      });

      setEditing(false);
    } catch {
      // Keep the editor open if persistence fails.
    }
  }

  return (
    <div className="rounded-lg border p-4">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Type
            </label>

            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
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
              onChange={(event) => setLimit(event.target.value)}
              disabled={saving}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{item.type}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.limit}
              </p>
            </div>

            {editable && (
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
            )}
          </div>

          <EvidenceList references={item.sourceReferences} />
        </>
      )}
    </div>
  );
}

/**
 * Timeline editor.
 */
function TimelineEditor({
  timeline,
  editable,
  saving,
  onSave,
}: {
  timeline: Timeline;
  editable: boolean;
  saving: boolean;
  onSave: (timeline: Timeline) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [duration, setDuration] = useState(
    timeline.duration ?? "",
  );
  const [startCondition, setStartCondition] = useState(
    timeline.startCondition ?? "",
  );
  const [dependencies, setDependencies] = useState(
    timeline.dependencies.join("\n"),
  );
  const [error, setError] = useState("");

  function startEditing() {
    setDuration(timeline.duration ?? "");
    setStartCondition(timeline.startCondition ?? "");
    setDependencies(timeline.dependencies.join("\n"));
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setDuration(timeline.duration ?? "");
    setStartCondition(timeline.startCondition ?? "");
    setDependencies(timeline.dependencies.join("\n"));
    setError("");
    setEditing(false);
  }

  async function handleSave() {
    const updatedTimeline: Timeline = {
      ...timeline,
      duration: duration.trim() || undefined,
      startCondition: startCondition.trim() || undefined,
      dependencies: dependencies
        .split("\n")
        .map((dependency) => dependency.trim())
        .filter(Boolean),
    };

    if (
      !updatedTimeline.duration &&
      !updatedTimeline.startCondition &&
      updatedTimeline.dependencies.length === 0
    ) {
      setError("Timeline must contain at least one value.");
      return;
    }

    setError("");

    try {
      await onSave(updatedTimeline);
      setEditing(false);
    } catch {
      // Keep the editor open if persistence fails.
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">Timeline</h3>

      <div className="mt-3 rounded-lg border p-4">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Duration
              </label>

              <input
                value={duration}
                onChange={(event) =>
                  setDuration(event.target.value)
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
                  setStartCondition(event.target.value)
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
                  setDependencies(event.target.value)
                }
                disabled={saving}
                placeholder="One dependency per line"
                className="mt-2 min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
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

                {timeline.dependencies.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">
                      Dependencies
                    </p>

                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {timeline.dependencies.map(
                        (dependency, index) => (
                          <li key={`${dependency}-${index}`}>
                            {dependency}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {editable && (
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
              )}
            </div>

            <EvidenceList references={timeline.sourceReferences} />
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Assumption editor.
 */
function AssumptionCard({
  item,
  editable,
  saving,
  onSave,
}: {
  item: Assumption;
  editable: boolean;
  saving: boolean;
  onSave: (item: Assumption) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(item.statement);
  const [error, setError] = useState("");

  function startEditing() {
    setStatement(item.statement);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setStatement(item.statement);
    setError("");
    setEditing(false);
  }

  async function handleSave() {
    const trimmedStatement = statement.trim();

    if (!trimmedStatement) {
      setError("Statement cannot be empty.");
      return;
    }

    setError("");

    try {
      await onSave({
        ...item,
        statement: trimmedStatement,
      });

      setEditing(false);
    } catch {
      // Keep the editor open if persistence fails.
    }
  }

  return (
    <div className="rounded-lg border p-4">
      {editing ? (
        <div className="space-y-4">
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
              className="mt-2 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm">{item.statement}</p>

            {editable && (
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
            )}
          </div>

          <EvidenceList references={item.sourceReferences} />
        </>
      )}
    </div>
  );
}

export function ScopeReview({
  projectId,
  baselineId,
  status,
  scope,
}: ScopeReviewProps) {
  const router = useRouter();

  const [reviewScope, setReviewScope] = useState(scope);

  // The database status is the initial source of truth.
  // This local value lets approval update the UI immediately.
  const [currentStatus, setCurrentStatus] = useState(status);

  const [savingSection, setSavingSection] = useState<string | null>(
    null,
  );
const [approving, setApproving] = useState(false);
const [creatingVersion, setCreatingVersion] = useState(false);
const [saveError, setSaveError] = useState("");

  // Only drafts can be edited.
  const editable = currentStatus === "DRAFT";

  /**
   * Persist a complete normalized scope through the server action.
   *
   * The server validates the entire structure and its evidence
   * before writing it to PostgreSQL.
   */
  async function persistScope(
    updatedScope: NormalizedScope,
    section: string,
  ) {
    setSavingSection(section);
    setSaveError("");

    try {
      await updateScopeBaselineAction({
        baselineId,
        structuredScope: updatedScope,
      });

      setReviewScope(updatedScope);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save the scope changes.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleApprove() {
    // Do not even send an approval request if this version
    // is already approved.
    if (currentStatus !== "DRAFT") {
      return;
    }

    setApproving(true);
    setSaveError("");

    try {
      const result = await approveScopeBaselineAction(
        baselineId,
      );

      // Use the status returned by the server as the new UI state.
      setCurrentStatus(result.status);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't approve the scope.",
      );
    } finally {
      setApproving(false);
    }
  }
    async function handleCreateVersion() {
    // Only an approved scope can start a new version.
    if (currentStatus !== "APPROVED") {
      return;
    }

    setCreatingVersion(true);
    setSaveError("");

    try {
      await createScopeVersionAction(projectId);

      // The server creates the next draft version. Refresh the server
      // component so getProject() loads that newly created version.
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't create a new scope version.",
      );
    } finally {
      setCreatingVersion(false);
    }
  }

  async function updateScopeItem(
    section:
      | "deliverables"
      | "features"
      | "exclusions"
      | "clientResponsibilities",
    index: number,
    item: ScopeItem,
  ) {
    const updatedItems = [...reviewScope[section]];

    updatedItems[index] = item;

    await persistScope(
      {
        ...reviewScope,
        [section]: updatedItems,
      },
      section,
    );
  }

  async function updateRevisionLimit(
    index: number,
    item: RevisionLimit,
  ) {
    const updatedItems = [...reviewScope.revisionLimits];

    updatedItems[index] = item;

    await persistScope(
      {
        ...reviewScope,
        revisionLimits: updatedItems,
      },
      "revisionLimits",
    );
  }

  async function updateTimeline(timeline: Timeline) {
    await persistScope(
      {
        ...reviewScope,
        timeline,
      },
      "timeline",
    );
  }

  async function updateAssumption(
    index: number,
    item: Assumption,
  ) {
    const updatedItems = [...reviewScope.assumptions];

    updatedItems[index] = item;

    await persistScope(
      {
        ...reviewScope,
        assumptions: updatedItems,
      },
      "assumptions",
    );
  }

  return (
    <div className="space-y-8">
      {/* This control exists only for draft baselines. */}
      {currentStatus === "DRAFT" && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Review scope</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Review the extracted scope before making it
              authoritative.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={approving || Boolean(savingSection)}
          >
            <Check />
            {approving ? "Approving..." : "Approve scope"}
          </Button>
        </div>
      )}

           {currentStatus === "APPROVED" && (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Scope approved</p>

            <p className="mt-1 text-sm text-muted-foreground">
              This scope is now the authoritative project baseline.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCreateVersion}
            disabled={creatingVersion}
          >
            <Plus />
            {creatingVersion
              ? "Creating version..."
              : "Create new scope version"}
          </Button>
        </div>
      )}

      {savingSection && (
        <p className="text-sm text-muted-foreground">
          Saving changes...
        </p>
      )}

      {saveError && (
        <p className="text-sm text-destructive">
          {saveError}
        </p>
      )}

      <ScopeItemList
        title="Deliverables"
        items={reviewScope.deliverables}
        editable={editable}
        savingSection={savingSection === "deliverables"}
        onItemSave={(index, item) =>
          updateScopeItem("deliverables", index, item)
        }
      />

      <ScopeItemList
        title="Features"
        items={reviewScope.features}
        editable={editable}
        savingSection={savingSection === "features"}
        onItemSave={(index, item) =>
          updateScopeItem("features", index, item)
        }
      />

      <ScopeItemList
        title="Exclusions"
        items={reviewScope.exclusions}
        editable={editable}
        savingSection={savingSection === "exclusions"}
        onItemSave={(index, item) =>
          updateScopeItem("exclusions", index, item)
        }
      />

      <ScopeItemList
        title="Client Responsibilities"
        items={reviewScope.clientResponsibilities}
        editable={editable}
        savingSection={
          savingSection === "clientResponsibilities"
        }
        onItemSave={(index, item) =>
          updateScopeItem(
            "clientResponsibilities",
            index,
            item,
          )
        }
      />

      {reviewScope.revisionLimits.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">
            Revision Limits
          </h3>

          <div className="mt-3 space-y-3">
            {reviewScope.revisionLimits.map((item, index) => (
              <RevisionLimitCard
                key={`${item.type}-${index}`}
                item={item}
                editable={editable}
                saving={savingSection === "revisionLimits"}
                onSave={(updatedItem) =>
                  updateRevisionLimit(index, updatedItem)
                }
              />
            ))}
          </div>
        </section>
      )}

      <TimelineEditor
        timeline={reviewScope.timeline}
        editable={editable}
        saving={savingSection === "timeline"}
        onSave={updateTimeline}
      />

      {reviewScope.assumptions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">
            Assumptions
          </h3>

          <div className="mt-3 space-y-3">
            {reviewScope.assumptions.map((item, index) => (
              <AssumptionCard
                key={`${item.statement}-${index}`}
                item={item}
                editable={editable}
                saving={savingSection === "assumptions"}
                onSave={(updatedItem) =>
                  updateAssumption(index, updatedItem)
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}