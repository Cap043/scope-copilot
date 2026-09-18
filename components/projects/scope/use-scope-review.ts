"use client";

import { useState } from "react";

import {
  addManualScopeItemAction,
  amendScopeItemAction,
  amendScopeTimelineAction,
  approveScopeBaselineAction,
  createScopeVersionAction,
  removeScopeItemAction,
} from "@/app/(dashboard)/projects/[projectId]/actions";

import type {
  AmendmentMeta,
  Assumption,
  RevisionLimit,
  ScopeArraySection,
  ScopeItem,
  ScopeReviewProps,
  Timeline,
} from "./scope-types";

/**
 * Owns ScopeReview state and server-action orchestration.
 * Keeping mutation logic here leaves the page component focused on rendering.
 */
export function useScopeReview({
  projectId,
  baselineId,
  status,
  scope,
}: ScopeReviewProps) {
  const [reviewScope, setReviewScope] =
    useState(scope);

  // The database status is the initial source of truth.
  // Local state lets successful approval update the UI immediately.
  const [currentStatus, setCurrentStatus] =
    useState(status);

  const [savingSection, setSavingSection] =
    useState<string | null>(null);

  const [
    addFormSection,
    setAddFormSection,
  ] = useState<ScopeArraySection | null>(
    null,
  );

  const [approving, setApproving] =
    useState(false);

  const [creatingVersion, setCreatingVersion] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  const editable =
    currentStatus === "DRAFT";

  async function handleApprove() {
    if (currentStatus !== "DRAFT") {
      return;
    }

    setApproving(true);
    setSaveError("");

    try {
      const result =
        await approveScopeBaselineAction(
          baselineId,
        );

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
    if (currentStatus !== "APPROVED") {
      return;
    }

    setCreatingVersion(true);
    setSaveError("");

    try {
      await createScopeVersionAction(
        projectId,
      );

      // The project page will fetch the new baseline.
      // `key={baseline.id}` on the page remounts this client
      // component so the new DRAFT state becomes local state.
      window.location.reload();
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

  async function handleEditItem(
    section:
      | "deliverables"
      | "features"
      | "exclusions"
      | "clientResponsibilities",
    item: ScopeItem,
    meta: AmendmentMeta,
  ) {
    setSavingSection(section);
    setSaveError("");

    try {
      await amendScopeItemAction({
        baselineId,
        section,
        itemId: item.id,
        changes: {
          title: item.title,
          description: item.description,
        },
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        [section]: previous[
          section
        ].map((existingItem) => {
          if (existingItem.id !== item.id) {
            return existingItem;
          }

          if (
            existingItem.provenance.type ===
            "document_extraction"
          ) {
            return {
              ...item,
              provenance: {
                type:
                  "document_extraction",
              },
              amendment: {
                rationale:
                  meta.rationale,
                referenceId:
                  meta.referenceId,
              },
              status: "active",
              removal: undefined,
            };
          }

          return {
            ...item,
            provenance: {
              type: "manual_amendment",
              rationale:
                meta.rationale,
              referenceId:
                meta.referenceId,
            },
            amendment: undefined,
            status: "active",
            removal: undefined,
          };
        }),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save the scope amendment.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleEditRevisionLimit(
    item: RevisionLimit,
    meta: AmendmentMeta,
  ) {
    setSavingSection("revisionLimits");
    setSaveError("");

    try {
      await amendScopeItemAction({
        baselineId,
        section: "revisionLimits",
        itemId: item.id,
        changes: {
          type: item.type,
          limit: item.limit,
        },
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        revisionLimits:
          previous.revisionLimits.map(
            (existingItem) => {
              if (
                existingItem.id !==
                item.id
              ) {
                return existingItem;
              }

              if (
                existingItem.provenance
                  .type ===
                "document_extraction"
              ) {
                return {
                  ...item,
                  provenance: {
                    type:
                      "document_extraction",
                  },
                  amendment: {
                    rationale:
                      meta.rationale,
                    referenceId:
                      meta.referenceId,
                  },
                  status: "active",
                  removal: undefined,
                };
              }

              return {
                ...item,
                provenance: {
                  type: "manual_amendment",
                  rationale:
                    meta.rationale,
                  referenceId:
                    meta.referenceId,
                },
                amendment: undefined,
                status: "active",
                removal: undefined,
              };
            },
          ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save the revision limit.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleEditAssumption(
    item: Assumption,
    meta: AmendmentMeta,
  ) {
    setSavingSection("assumptions");
    setSaveError("");

    try {
      await amendScopeItemAction({
        baselineId,
        section: "assumptions",
        itemId: item.id,
        changes: {
          statement: item.statement,
        },
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        assumptions:
          previous.assumptions.map(
            (existingItem) => {
              if (
                existingItem.id !==
                item.id
              ) {
                return existingItem;
              }

              if (
                existingItem.provenance
                  .type ===
                "document_extraction"
              ) {
                return {
                  ...item,
                  provenance: {
                    type:
                      "document_extraction",
                  },
                  amendment: {
                    rationale:
                      meta.rationale,
                    referenceId:
                      meta.referenceId,
                  },
                  status: "active",
                  removal: undefined,
                };
              }

              return {
                ...item,
                provenance: {
                  type: "manual_amendment",
                  rationale:
                    meta.rationale,
                  referenceId:
                    meta.referenceId,
                },
                amendment: undefined,
                status: "active",
                removal: undefined,
              };
            },
          ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save the assumption.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleRemoveItem(
    section:
      | "deliverables"
      | "features"
      | "exclusions"
      | "clientResponsibilities",
    item: ScopeItem,
    meta: AmendmentMeta,
  ) {
    setSavingSection(section);
    setSaveError("");

    try {
      await removeScopeItemAction({
        baselineId,
        section,
        itemId: item.id,
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        [section]: previous[
          section
        ].map((existingItem) =>
          existingItem.id === item.id
            ? {
                ...existingItem,
                status: "removed",
                removal: {
                  rationale:
                    meta.rationale,
                  referenceId:
                    meta.referenceId,
                },
              }
            : existingItem,
        ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't remove the scope item.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleRemoveRevisionLimit(
    item: RevisionLimit,
    meta: AmendmentMeta,
  ) {
    setSavingSection("revisionLimits");
    setSaveError("");

    try {
      await removeScopeItemAction({
        baselineId,
        section: "revisionLimits",
        itemId: item.id,
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        revisionLimits:
          previous.revisionLimits.map(
            (existingItem) =>
              existingItem.id === item.id
                ? {
                    ...existingItem,
                    status: "removed",
                    removal: {
                      rationale:
                        meta.rationale,
                      referenceId:
                        meta.referenceId,
                    },
                  }
                : existingItem,
          ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't remove the revision limit.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleRemoveAssumption(
    item: Assumption,
    meta: AmendmentMeta,
  ) {
    setSavingSection("assumptions");
    setSaveError("");

    try {
      await removeScopeItemAction({
        baselineId,
        section: "assumptions",
        itemId: item.id,
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      setReviewScope((previous) => ({
        ...previous,
        assumptions:
          previous.assumptions.map(
            (existingItem) =>
              existingItem.id === item.id
                ? {
                    ...existingItem,
                    status: "removed",
                    removal: {
                      rationale:
                        meta.rationale,
                      referenceId:
                        meta.referenceId,
                    },
                  }
                : existingItem,
          ),
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't remove the assumption.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleAddStandardItem(
    section:
      | "deliverables"
      | "features"
      | "exclusions"
      | "clientResponsibilities",
    item: {
      title: string;
      description?: string;
    },
    meta: AmendmentMeta,
  ) {
    setSavingSection(section);
    setSaveError("");

    try {
      const result =
        await addManualScopeItemAction({
          baselineId,
          section,
          item,
          rationale: meta.rationale,
          referenceId: meta.referenceId,
        });

      const newItem = {
        ...item,
        id: result.id,
        sourceReferences: [],
        provenance: {
          type: "manual_amendment" as const,
          rationale: meta.rationale,
          referenceId:
            meta.referenceId,
        },
        status: "active" as const,
      };

      setReviewScope((previous) => ({
        ...previous,
        [section]: [
          ...previous[section],
          newItem,
        ],
      }));

      setAddFormSection(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't add the scope item.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleAddRevisionLimit(
    item: {
      type: string;
      limit: string;
    },
    meta: AmendmentMeta,
  ) {
    setSavingSection("revisionLimits");
    setSaveError("");

    try {
      const result =
        await addManualScopeItemAction({
          baselineId,
          section: "revisionLimits",
          item,
          rationale: meta.rationale,
          referenceId: meta.referenceId,
        });

      const newItem = {
        ...item,
        id: result.id,
        sourceReferences: [],
        provenance: {
          type: "manual_amendment" as const,
          rationale: meta.rationale,
          referenceId:
            meta.referenceId,
        },
        status: "active" as const,
      };

      setReviewScope((previous) => ({
        ...previous,
        revisionLimits: [
          ...previous.revisionLimits,
          newItem,
        ],
      }));

      setAddFormSection(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't add the revision limit.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleAddAssumption(
    item: {
      statement: string;
    },
    meta: AmendmentMeta,
  ) {
    setSavingSection("assumptions");
    setSaveError("");

    try {
      const result =
        await addManualScopeItemAction({
          baselineId,
          section: "assumptions",
          item,
          rationale: meta.rationale,
          referenceId: meta.referenceId,
        });

      const newItem = {
        ...item,
        id: result.id,
        sourceReferences: [],
        provenance: {
          type: "manual_amendment" as const,
          rationale: meta.rationale,
          referenceId:
            meta.referenceId,
        },
        status: "active" as const,
      };

      setReviewScope((previous) => ({
        ...previous,
        assumptions: [
          ...previous.assumptions,
          newItem,
        ],
      }));

      setAddFormSection(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't add the assumption.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }

  async function handleTimelineSave(
    timeline: Timeline,
    meta: AmendmentMeta,
  ) {
    setSavingSection("timeline");
    setSaveError("");

    try {
      await amendScopeTimelineAction({
        baselineId,
        duration: timeline.duration,
        startCondition:
          timeline.startCondition,
        dependencies:
          timeline.dependencies,
        rationale: meta.rationale,
        referenceId: meta.referenceId,
      });

      const previousTimeline =
        reviewScope.timeline;

      const isDocumentDerived =
        previousTimeline.provenance
          ?.type ===
        "document_extraction";

      setReviewScope((previous) => ({
        ...previous,
        timeline: {
          ...timeline,
          sourceReferences:
            isDocumentDerived
              ? previousTimeline.sourceReferences
              : [],
          provenance: isDocumentDerived
            ? {
                type:
                  "document_extraction",
              }
            : {
                type: "manual_amendment",
                rationale:
                  meta.rationale,
                referenceId:
                  meta.referenceId,
              },
          amendment: isDocumentDerived
            ? {
                rationale:
                  meta.rationale,
                referenceId:
                  meta.referenceId,
              }
            : undefined,
        },
      }));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save the timeline.",
      );

      throw error;
    } finally {
      setSavingSection(null);
    }
  }


  return {
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
  };
}
