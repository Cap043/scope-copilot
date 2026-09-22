"use client";

import { FileText } from "lucide-react";

import { AddAssumptionForm } from "../add-assumption-form";
import { AddRevisionLimitForm } from "../add-revision-limit-form";
import { AddStandardItemForm } from "../add-standard-item-form";
import { AssumptionCard } from "../assumption-card";
import { RevisionLimitCard } from "../revision-limit-card";
import { ScopeItemCard } from "../scope-item-card";
import { TimelineEditor } from "../timeline-editor";

import { SECTION_META } from "./section-meta";

import type {
  Assumption,
  RevisionLimit,
  ScopeItem,
  ScopeReviewController,
  SectionKey,
} from "./types";

export function ScopeDetailPanel({
  editable,
  savingSection,
  addFormSection,
  setAddFormSection,
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
  reviewScope,
  activeSection,
  selectedStandardItem,
  selectedRevisionLimit,
  selectedAssumption,
}: Pick<
  ScopeReviewController,
  | "editable"
  | "savingSection"
  | "addFormSection"
  | "setAddFormSection"
  | "handleEditItem"
  | "handleEditRevisionLimit"
  | "handleEditAssumption"
  | "handleRemoveItem"
  | "handleRemoveRevisionLimit"
  | "handleRemoveAssumption"
  | "handleAddStandardItem"
  | "handleAddRevisionLimit"
  | "handleAddAssumption"
  | "handleTimelineSave"
  | "reviewScope"
> & {
  activeSection: SectionKey;
  selectedStandardItem?: ScopeItem;
  selectedRevisionLimit?: RevisionLimit;
  selectedAssumption?: Assumption;
}) {
  const isStandardSelection =
    activeSection !== "overview" &&
    activeSection !== "revisionLimits" &&
    activeSection !== "timeline" &&
    activeSection !== "assumptions";

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b px-4 py-3">
          <p className="text-sm font-semibold">
            {addFormSection
              ? `Add to ${
                  SECTION_META[
                    addFormSection as SectionKey
                  ].label
                }`
              : "Item details"}
          </p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {addFormSection
              ? "Add a new scope item."
              : activeSection === "overview"
                ? "Scope summary"
                : "Selected scope item"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {addFormSection === "deliverables" && (
            <div className="p-4">
              <AddStandardItemForm
                saving={savingSection === "deliverables"}
                onCancel={() => setAddFormSection(null)}
                onAdd={(item, meta) =>
                  handleAddStandardItem(
                    "deliverables",
                    item,
                    meta,
                  )
                }
              />
            </div>
          )}

          {addFormSection === "features" && (
            <div className="p-4">
              <AddStandardItemForm
                saving={savingSection === "features"}
                onCancel={() => setAddFormSection(null)}
                onAdd={(item, meta) =>
                  handleAddStandardItem(
                    "features",
                    item,
                    meta,
                  )
                }
              />
            </div>
          )}

          {addFormSection === "exclusions" && (
            <div className="p-4">
              <AddStandardItemForm
                saving={savingSection === "exclusions"}
                onCancel={() => setAddFormSection(null)}
                onAdd={(item, meta) =>
                  handleAddStandardItem(
                    "exclusions",
                    item,
                    meta,
                  )
                }
              />
            </div>
          )}

          {addFormSection === "clientResponsibilities" && (
            <div className="p-4">
              <AddStandardItemForm
                saving={
                  savingSection ===
                  "clientResponsibilities"
                }
                onCancel={() => setAddFormSection(null)}
                onAdd={(item, meta) =>
                  handleAddStandardItem(
                    "clientResponsibilities",
                    item,
                    meta,
                  )
                }
              />
            </div>
          )}

          {addFormSection === "revisionLimits" && (
            <div className="p-4">
              <AddRevisionLimitForm
                saving={savingSection === "revisionLimits"}
                onCancel={() => setAddFormSection(null)}
                onAdd={handleAddRevisionLimit}
              />
            </div>
          )}

          {addFormSection === "assumptions" && (
            <div className="p-4">
              <AddAssumptionForm
                saving={savingSection === "assumptions"}
                onCancel={() => setAddFormSection(null)}
                onAdd={handleAddAssumption}
              />
            </div>
          )}

          {!addFormSection &&
            selectedStandardItem &&
            isStandardSelection && (
              <div className="min-h-full p-4">
                <ScopeItemCard
                  key={selectedStandardItem.id}
                  item={selectedStandardItem}
                  editable={editable}
                  saving={savingSection === activeSection}
                  onSave={handleEditItem.bind(
                    null,
                    activeSection as
                      | "deliverables"
                      | "features"
                      | "exclusions"
                      | "clientResponsibilities",
                  )}
                  onRemove={handleRemoveItem.bind(
                    null,
                    activeSection as
                      | "deliverables"
                      | "features"
                      | "exclusions"
                      | "clientResponsibilities",
                  )}
                />
              </div>
            )}

          {!addFormSection &&
            selectedRevisionLimit &&
            activeSection === "revisionLimits" && (
              <div className="min-h-full p-4">
                <RevisionLimitCard
                  key={selectedRevisionLimit.id}
                  item={selectedRevisionLimit}
                  editable={editable}
                  saving={savingSection === "revisionLimits"}
                  onSave={handleEditRevisionLimit}
                  onRemove={handleRemoveRevisionLimit}
                />
              </div>
            )}

          {!addFormSection &&
            selectedAssumption &&
            activeSection === "assumptions" && (
              <div className="min-h-full p-4">
                <AssumptionCard
                  key={selectedAssumption.id}
                  item={selectedAssumption}
                  editable={editable}
                  saving={savingSection === "assumptions"}
                  onSave={handleEditAssumption}
                  onRemove={handleRemoveAssumption}
                />
              </div>
            )}

          {!addFormSection &&
            activeSection === "timeline" && (
              <div className="p-4">
                <TimelineEditor
                  timeline={reviewScope.timeline}
                  editable={editable}
                  saving={savingSection === "timeline"}
                  onSave={handleTimelineSave}
                />
              </div>
            )}

          {!addFormSection &&
            activeSection === "overview" && (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>

                <p className="mt-3 text-sm font-medium">
                  Scope overview
                </p>

                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Select a scope area to inspect its items and source evidence.
                </p>
              </div>
            )}

          {!addFormSection &&
            activeSection !== "overview" &&
            activeSection !== "timeline" &&
            !selectedStandardItem &&
            !selectedRevisionLimit &&
            !selectedAssumption && (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>

                <p className="mt-3 text-sm font-medium">
                  No active items
                </p>

                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  This scope section does not contain any active items.
                </p>
              </div>
            )}
        </div>
      </div>
    </aside>
  );
}
