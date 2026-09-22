import type { NormalizedScope } from "@/lib/scope-schema";

import type {
  ReviewScope,
  SectionKey,
} from "./types";

export function getActiveScopeItems(
  scope: ReviewScope,
) {
  return {
    deliverables: scope.deliverables.filter(
      (item) => item.status === "active",
    ),
    features: scope.features.filter(
      (item) => item.status === "active",
    ),
    exclusions: scope.exclusions.filter(
      (item) => item.status === "active",
    ),
    clientResponsibilities:
      scope.clientResponsibilities.filter(
        (item) => item.status === "active",
      ),
    revisionLimits: scope.revisionLimits.filter(
      (item) => item.status === "active",
    ),
    assumptions: scope.assumptions.filter(
      (item) => item.status === "active",
    ),
  };
}

export type ActiveScopeItems = ReturnType<
  typeof getActiveScopeItems
>;

export function getEvidenceCount(
  scope: NormalizedScope,
) {
  return (
    scope.deliverables.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.features.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.exclusions.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.clientResponsibilities.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.revisionLimits.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.assumptions.reduce(
      (total, item) =>
        total + item.sourceReferences.length,
      0,
    ) +
    scope.timeline.sourceReferences.length
  );
}

export function getSectionCount(
  section: SectionKey,
  activeItems: ActiveScopeItems,
) {
  switch (section) {
    case "deliverables":
      return activeItems.deliverables.length;
    case "features":
      return activeItems.features.length;
    case "exclusions":
      return activeItems.exclusions.length;
    case "clientResponsibilities":
      return activeItems.clientResponsibilities.length;
    case "revisionLimits":
      return activeItems.revisionLimits.length;
    case "assumptions":
      return activeItems.assumptions.length;
    case "timeline":
      return 1;
    default:
      return 0;
  }
}
