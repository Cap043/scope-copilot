"use client";

import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { AddAssumptionForm } from "./add-assumption-form";
import { AddRevisionLimitForm } from "./add-revision-limit-form";
import { AssumptionCard } from "./assumption-card";
import { RevisionLimitCard } from "./revision-limit-card";
import { ScopeItemList } from "./scope-item-list";
import { TimelineEditor } from "./timeline-editor";
import { useScopeReview } from "./use-scope-review";
import type { ScopeReviewProps } from "./scope-types";

export function ScopeReview(props: ScopeReviewProps) {
  const {
    reviewScope,
    currentStatus,
    savingSection,
    addFormSection,
    setAddFormSection,
    approving,
    creatingVersion,
    saveError,
    editable,
    handleApprove,
    handleCreateVersion,
    handleEditItem,
    handleEditRevisionLimit,
    handleEditAssumption,
    handleRemoveItem,
    handleRemoveRevisionLimit,
    handleRemoveAssumption,
    handleAddStandardItem,
    handleAddRevisionLimit,
    handleAddAssumption,
    handleTimelineSave,
  } = useScopeReview(props);

  return (
    <div className="space-y-8">
      {currentStatus === "DRAFT" && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">
              Review scope
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Review the extracted scope and record any
              agreed amendments before making it authoritative.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={
              approving ||
              Boolean(savingSection)
            }
          >
            <Check />
            {approving
              ? "Approving..."
              : "Approve scope"}
          </Button>
        </div>
      )}

      {currentStatus === "APPROVED" && (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">
              Scope approved
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              This scope is now the authoritative project baseline.
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
  <Button
    type="button"
    variant="outline"
    nativeButton={false}
    render={
      <Link
        href={`/projects/${props.projectId}/scope/update`}
      />
    }
  >
    <Plus />
    Update from new SOW
  </Button>

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
        section="deliverables"
        title="Deliverables"
        items={reviewScope.deliverables}
        editable={editable}
        saving={
          savingSection ===
          "deliverables"
        }
        addFormOpen={
          addFormSection ===
          "deliverables"
        }
        onStartAdd={() =>
          setAddFormSection(
            "deliverables",
          )
        }
        onCancelAdd={() =>
          setAddFormSection(null)
        }
        onAdd={(item, meta) =>
          handleAddStandardItem(
            "deliverables",
            item,
            meta,
          )
        }
        onEdit={handleEditItem.bind(
          null,
          "deliverables",
        )}
        onRemove={handleRemoveItem.bind(
          null,
          "deliverables",
        )}
      />

      <ScopeItemList
        section="features"
        title="Features"
        items={reviewScope.features}
        editable={editable}
        saving={
          savingSection === "features"
        }
        addFormOpen={
          addFormSection === "features"
        }
        onStartAdd={() =>
          setAddFormSection("features")
        }
        onCancelAdd={() =>
          setAddFormSection(null)
        }
        onAdd={(item, meta) =>
          handleAddStandardItem(
            "features",
            item,
            meta,
          )
        }
        onEdit={handleEditItem.bind(
          null,
          "features",
        )}
        onRemove={handleRemoveItem.bind(
          null,
          "features",
        )}
      />

      <ScopeItemList
        section="exclusions"
        title="Exclusions"
        items={reviewScope.exclusions}
        editable={editable}
        saving={
          savingSection === "exclusions"
        }
        addFormOpen={
          addFormSection === "exclusions"
        }
        onStartAdd={() =>
          setAddFormSection(
            "exclusions",
          )
        }
        onCancelAdd={() =>
          setAddFormSection(null)
        }
        onAdd={(item, meta) =>
          handleAddStandardItem(
            "exclusions",
            item,
            meta,
          )
        }
        onEdit={handleEditItem.bind(
          null,
          "exclusions",
        )}
        onRemove={handleRemoveItem.bind(
          null,
          "exclusions",
        )}
      />

      <ScopeItemList
        section="clientResponsibilities"
        title="Client Responsibilities"
        items={
          reviewScope.clientResponsibilities
        }
        editable={editable}
        saving={
          savingSection ===
          "clientResponsibilities"
        }
        addFormOpen={
          addFormSection ===
          "clientResponsibilities"
        }
        onStartAdd={() =>
          setAddFormSection(
            "clientResponsibilities",
          )
        }
        onCancelAdd={() =>
          setAddFormSection(null)
        }
        onAdd={(item, meta) =>
          handleAddStandardItem(
            "clientResponsibilities",
            item,
            meta,
          )
        }
        onEdit={handleEditItem.bind(
          null,
          "clientResponsibilities",
        )}
        onRemove={handleRemoveItem.bind(
          null,
          "clientResponsibilities",
        )}
      />

      <section>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">
            Revision Limits
          </h3>

          {editable &&
            addFormSection !==
              "revisionLimits" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAddFormSection(
                    "revisionLimits",
                  )
                }
              >
                <Plus />
                Add
              </Button>
            )}
        </div>

        <div className="mt-3 space-y-3">
          {reviewScope.revisionLimits.map(
            (item) => (
              <RevisionLimitCard
                key={item.id}
                item={item}
                editable={editable}
                saving={
                  savingSection ===
                  "revisionLimits"
                }
                onSave={
                  handleEditRevisionLimit
                }
                onRemove={
                  handleRemoveRevisionLimit
                }
              />
            ),
          )}

          {reviewScope.revisionLimits.length ===
            0 &&
            addFormSection !==
              "revisionLimits" && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No revision limits.
              </p>
            )}

          {addFormSection ===
            "revisionLimits" && (
            <AddRevisionLimitForm
              saving={
                savingSection ===
                "revisionLimits"
              }
              onCancel={() =>
                setAddFormSection(null)
              }
              onAdd={
                handleAddRevisionLimit
              }
            />
          )}
        </div>
      </section>

      <TimelineEditor
        timeline={reviewScope.timeline}
        editable={editable}
        saving={
          savingSection === "timeline"
        }
        onSave={handleTimelineSave}
      />

      <section>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">
            Assumptions
          </h3>

          {editable &&
            addFormSection !==
              "assumptions" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAddFormSection(
                    "assumptions",
                  )
                }
              >
                <Plus />
                Add
              </Button>
            )}
        </div>

        <div className="mt-3 space-y-3">
          {reviewScope.assumptions.map(
            (item) => (
              <AssumptionCard
                key={item.id}
                item={item}
                editable={editable}
                saving={
                  savingSection ===
                  "assumptions"
                }
                onSave={
                  handleEditAssumption
                }
                onRemove={
                  handleRemoveAssumption
                }
              />
            ),
          )}

          {reviewScope.assumptions.length ===
            0 &&
            addFormSection !==
              "assumptions" && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No assumptions.
              </p>
            )}

          {addFormSection ===
            "assumptions" && (
            <AddAssumptionForm
              saving={
                savingSection ===
                "assumptions"
              }
              onCancel={() =>
                setAddFormSection(null)
              }
              onAdd={
                handleAddAssumption
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}