"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  isStandardSection,
  SECTION_META,
} from "./section-meta";
import { ScopeItemRow } from "./scope-item-row";
import { ScopeOverview } from "./scope-overview";
import type {
  ScopeReviewController,
  SectionKey,
} from "./types";
import type { ActiveScopeItems } from "./utils";
import { getSectionCount } from "./utils";

export function ScopeWorkspace({
  editable,
  activeSection,
  selectedItemId,
  setSelectedItemId,
  activeItems,
  activeStandardItems,
  addFormSection,
  setAddFormSection,
  reviewScope,
  onSelectSection,
}: Pick<
  ScopeReviewController,
  | "editable"
  | "addFormSection"
  | "setAddFormSection"
  | "reviewScope"
> & {
  activeSection: SectionKey;
  selectedItemId: string | null;
  setSelectedItemId: (value: string | null) => void;
  activeItems: ActiveScopeItems;
  activeStandardItems: ActiveScopeItems["deliverables"];
  onSelectSection: (section: SectionKey) => void;
}) {
  const meta = SECTION_META[activeSection];
  const sectionCount = getSectionCount(
    activeSection,
    activeItems,
  );

  function startAdd() {
    if (
      !isStandardSection(activeSection) &&
      activeSection !== "revisionLimits" &&
      activeSection !== "assumptions"
    ) {
      return;
    }

    setAddFormSection(
      activeSection as
        | "deliverables"
        | "features"
        | "exclusions"
        | "clientResponsibilities"
        | "revisionLimits"
        | "assumptions",
    );
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {meta.icon}
            </span>

            <h3 className="truncate text-sm font-semibold">
              {meta.label}
            </h3>

            {activeSection !== "overview" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {sectionCount}
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {meta.description}
          </p>
        </div>

        {editable &&
          activeSection !== "overview" &&
          activeSection !== "timeline" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startAdd}
              disabled={Boolean(addFormSection)}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeSection === "overview" && (
          <ScopeOverview
            reviewScope={reviewScope}
            onSelectSection={onSelectSection}
          />
        )}

        {isStandardSection(activeSection) &&
          (activeStandardItems.length > 0 ? (
            <div>
              {activeStandardItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedItemId(item.id)
                  }
                  className="block w-full text-left"
                >
                  <ScopeItemRow
                    title={item.title}
                    description={item.description}
                    selected={
                      item.id === selectedItemId
                    }
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No active items in this section.
              </p>
            </div>
          ))}

        {activeSection === "revisionLimits" &&
          (activeItems.revisionLimits.length > 0 ? (
            <div>
              {activeItems.revisionLimits.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedItemId(item.id)
                  }
                  className="block w-full text-left"
                >
                  <ScopeItemRow
                    title={item.type}
                    description={item.limit}
                    selected={
                      item.id === selectedItemId
                    }
                    wrapTitle
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No active revision limits.
              </p>
            </div>
          ))}

        {activeSection === "assumptions" &&
          (activeItems.assumptions.length > 0 ? (
            <div>
              {activeItems.assumptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedItemId(item.id)
                  }
                  className="block w-full text-left"
                >
                  <ScopeItemRow
                    title={item.statement}
                    selected={
                      item.id === selectedItemId
                    }
                    wrapTitle
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No active assumptions.
              </p>
            </div>
          ))}

        {activeSection === "timeline" && (
          <div className="p-4 sm:p-5">
            <div className="rounded-lg border bg-muted/10 p-4">
              <div>
                <p className="text-sm font-semibold">
                  {reviewScope.timeline.duration ??
                    "Timeline"}
                </p>

                {reviewScope.timeline.startCondition && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {reviewScope.timeline.startCondition}
                  </p>
                )}

                {reviewScope.timeline.dependencies
                  .length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium">
                      Dependencies
                    </p>

                    <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted-foreground">
                      {reviewScope.timeline.dependencies.map(
                        (dependency, index) => (
                          <li
                            key={`${dependency}-${index}`}
                            className="flex gap-2"
                          >
                            <span>•</span>
                            <span className="min-w-0 break-words">
                              {dependency}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
