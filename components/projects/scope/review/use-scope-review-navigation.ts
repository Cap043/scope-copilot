"use client";

import { useEffect, useMemo, useState } from "react";

import {
  isSectionKey,
  isStandardSection,
} from "./section-meta";
import type {
  ScopeReviewController,
  SectionKey,
} from "./types";

export function useScopeReviewNavigation({
  reviewScope,
  setAddFormSection,
}: Pick<
  ScopeReviewController,
  "reviewScope" | "setAddFormSection"
>) {
  // Keep the first server/client render deterministic.
  // The URL hash is applied after hydration.
  const [activeSection, setActiveSection] =
    useState<SectionKey>("overview");

  const [selectedItemId, setSelectedItemId] =
    useState<string | null>(null);

  useEffect(() => {
    function syncHash() {
      const hash = window.location.hash.replace(
        "#",
        "",
      );

      if (isSectionKey(hash)) {
        setActiveSection(hash);
        setSelectedItemId(null);
        setAddFormSection(null);
      }
    }

    // Read the URL only after hydration.
    syncHash();

    window.addEventListener(
      "hashchange",
      syncHash,
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        syncHash,
      );
    };
  }, [setAddFormSection]);

  function selectSection(section: SectionKey) {
    setSelectedItemId(null);
    setAddFormSection(null);
    setActiveSection(section);

    // Hash state keeps the contextual sidebar synchronized.
    window.location.hash = section;
  }

  const activeItems = useMemo(
    () => ({
      deliverables: reviewScope.deliverables.filter(
        (item) => item.status === "active",
      ),
      features: reviewScope.features.filter(
        (item) => item.status === "active",
      ),
      exclusions: reviewScope.exclusions.filter(
        (item) => item.status === "active",
      ),
      clientResponsibilities:
        reviewScope.clientResponsibilities.filter(
          (item) => item.status === "active",
        ),
      revisionLimits: reviewScope.revisionLimits.filter(
        (item) => item.status === "active",
      ),
      assumptions: reviewScope.assumptions.filter(
        (item) => item.status === "active",
      ),
    }),
    [reviewScope],
  );

  const activeStandardItems = useMemo(() => {
    if (!isStandardSection(activeSection)) {
      return [];
    }

    return activeItems[activeSection];
  }, [activeItems, activeSection]);

  const selectedStandardItem =
    activeStandardItems.find(
      (item) => item.id === selectedItemId,
    );

  const selectedRevisionLimit =
    activeSection === "revisionLimits"
      ? activeItems.revisionLimits.find(
          (item) => item.id === selectedItemId,
        )
      : undefined;

  const selectedAssumption =
    activeSection === "assumptions"
      ? activeItems.assumptions.find(
          (item) => item.id === selectedItemId,
        )
      : undefined;

  useEffect(() => {
    let firstId: string | null = null;

    if (isStandardSection(activeSection)) {
      firstId = activeStandardItems[0]?.id ?? null;
    } else if (activeSection === "revisionLimits") {
      firstId = activeItems.revisionLimits[0]?.id ?? null;
    } else if (activeSection === "assumptions") {
      firstId = activeItems.assumptions[0]?.id ?? null;
    }

    if (!firstId) {
      setSelectedItemId(null);
      return;
    }

    const selectedStillExists =
      selectedItemId === firstId ||
      activeStandardItems.some(
        (item) => item.id === selectedItemId,
      ) ||
      activeItems.revisionLimits.some(
        (item) => item.id === selectedItemId,
      ) ||
      activeItems.assumptions.some(
        (item) => item.id === selectedItemId,
      );

    if (!selectedStillExists) {
      setSelectedItemId(firstId);
    }
  }, [
    activeItems,
    activeSection,
    activeStandardItems,
    selectedItemId,
  ]);

  return {
    activeSection,
    selectSection,
    selectedItemId,
    setSelectedItemId,
    activeItems,
    activeStandardItems,
    selectedStandardItem,
    selectedRevisionLimit,
    selectedAssumption,
  };
}
