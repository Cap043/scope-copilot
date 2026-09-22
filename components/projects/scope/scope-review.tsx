"use client";

import { useMemo } from "react";

import { useScopeReview } from "./use-scope-review";
import { ScopeDetailPanel } from "./review/scope-detail-panel";
import { ScopeSummary } from "./review/scope-summary";
import { ScopeToolbar } from "./review/scope-toolbar";
import { ScopeWorkspace } from "./review/scope-workspace";
import {
  STANDARD_SECTIONS,
} from "./review/section-meta";
import {
  useScopeReviewNavigation,
} from "./review/use-scope-review-navigation";
import type {
  ScopeReviewViewProps,
  StandardSection,
} from "./review/types";

export type { ScopeReviewViewProps } from "./review/types";

export function ScopeReview(
  props: ScopeReviewViewProps,
) {
  const controller = useScopeReview(props);

  const navigation =
    useScopeReviewNavigation({
      reviewScope: controller.reviewScope,
      setAddFormSection:
        controller.setAddFormSection,
    });

  // Keep the standard-section derivation in the orchestrator so
  // presentation components stay focused on rendering.
  const activeStandardItems = useMemo(() => {
    if (
      !STANDARD_SECTIONS.includes(
        navigation.activeSection as StandardSection,
      )
    ) {
      return [];
    }

    return controller.reviewScope[
      navigation.activeSection as StandardSection
    ].filter(
      (item) => item.status === "active",
    );
  }, [
    controller.reviewScope,
    navigation.activeSection,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScopeToolbar
        projectId={props.projectId}
        scopeVersion={props.scopeVersion}
        sourceText={props.sourceText}
        currentStatus={controller.currentStatus}
        savingSection={controller.savingSection}
        approving={controller.approving}
        creatingVersion={controller.creatingVersion}
        saveError={controller.saveError}
        handleApprove={controller.handleApprove}
        handleCreateVersion={
          controller.handleCreateVersion
        }
      />

      <ScopeSummary
        reviewScope={controller.reviewScope}
        activeSection={navigation.activeSection}
        onSelectSection={navigation.selectSection}
      />

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
        <ScopeWorkspace
          editable={controller.editable}
          activeSection={navigation.activeSection}
          selectedItemId={navigation.selectedItemId}
          setSelectedItemId={
            navigation.setSelectedItemId
          }
          activeItems={navigation.activeItems}
          activeStandardItems={activeStandardItems}
          addFormSection={controller.addFormSection}
          setAddFormSection={
            controller.setAddFormSection
          }
          reviewScope={controller.reviewScope}
          onSelectSection={navigation.selectSection}
        />

        <ScopeDetailPanel
          editable={controller.editable}
          savingSection={controller.savingSection}
          addFormSection={controller.addFormSection}
          setAddFormSection={
            controller.setAddFormSection
          }
          handleEditItem={controller.handleEditItem}
          handleEditRevisionLimit={
            controller.handleEditRevisionLimit
          }
          handleEditAssumption={
            controller.handleEditAssumption
          }
          handleRemoveItem={
            controller.handleRemoveItem
          }
          handleRemoveRevisionLimit={
            controller.handleRemoveRevisionLimit
          }
          handleRemoveAssumption={
            controller.handleRemoveAssumption
          }
          handleAddStandardItem={
            controller.handleAddStandardItem
          }
          handleAddRevisionLimit={
            controller.handleAddRevisionLimit
          }
          handleAddAssumption={
            controller.handleAddAssumption
          }
          handleTimelineSave={
            controller.handleTimelineSave
          }
          reviewScope={controller.reviewScope}
          activeSection={navigation.activeSection}
          selectedStandardItem={
            navigation.selectedStandardItem
          }
          selectedRevisionLimit={
            navigation.selectedRevisionLimit
          }
          selectedAssumption={
            navigation.selectedAssumption
          }
        />
      </div>
    </div>
  );
}
