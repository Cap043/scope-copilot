import { describe, expect, it } from "vitest";

import type {
  ExtractedScope,
  NormalizedScope,
} from "@/lib/scope-schema";

import { diffScopes } from "@/lib/scope-diff";
import {
  reconcileScopeIdentities,
} from "@/lib/scope-reconciliation";
import {
  getManualCarryOverRequests,
} from "@/lib/scope-carryover";

function emptyCandidate():
  ExtractedScope {
  return {
    deliverables: [],
    features: [],
    exclusions: [],
    clientResponsibilities: [],
    revisionLimits: [],
    timeline: {
      dependencies: [],
      sourceReferences: [],
    },
    assumptions: [],
  };
}

function emptyBase():
  NormalizedScope {
  return {
    deliverables: [],
    features: [],
    exclusions: [],
    clientResponsibilities: [],
    revisionLimits: [],
    timeline: {
      dependencies: [],
      sourceReferences: [],
      provenance: {
        type: "document_extraction",
      },
    },
    assumptions: [],
  } as NormalizedScope;
}

function documentItem(
  id: string,
  title: string,
  quote: string,
) {
  return {
    id,
    title,
    sourceReferences: [{ quote }],
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  };
}

function manualItem(
  id: string,
  title: string,
) {
  return {
    id,
    title,
    sourceReferences: [],
    provenance: {
      type: "manual_amendment" as const,
      rationale: "Accepted during client call",
      referenceId: "CALL-001",
    },
    status: "active" as const,
  };
}

function reviewData(
  base: NormalizedScope,
  candidate: ExtractedScope,
) {
  const diff = diffScopes(
    base,
    candidate,
  );

  return reconcileScopeIdentities(
    base,
    candidate,
    diff,
    () => "review-added",
  );
}

describe(
  "scope revision review",
  () => {
    it("surfaces additions and modifications from the diff", () => {
      const base =
        emptyBase();

      base.deliverables.push(
        documentItem(
          "homepage",
          "Homepage",
          "The agency will build the homepage.",
        ),
      );

      const candidate = {
        ...emptyCandidate(),
        deliverables: [
          {
            title: "Homepage",
            description:
              "A redesigned responsive homepage.",
            sourceReferences: [
              {
                quote:
                  "The agency will build the homepage with the revised visual design.",
              },
            ],
          },
          {
            title:
              "Membership page",
            sourceReferences: [
              {
                quote:
                  "The agency will include a Membership page.",
              },
            ],
          },
        ],
      } as ExtractedScope;

      const reconciliation =
        reviewData(
          base,
          candidate,
        );

      const statuses =
        reconciliation.scope
          .deliverables.map(
            (item) => item.relation,
          );

      expect(statuses).toContain(
        "MATCHED",
      );
      expect(statuses).toContain(
        "ADDED",
      );
    });

    it("surfaces a missing manual amendment as a carry-over request", () => {
      const base =
        emptyBase();

      base.features.push(
        manualItem(
          "manual-booking",
          "Custom booking flow",
        ),
      );

      const candidate =
        emptyCandidate();

      const reconciliation =
        reviewData(
          base,
          candidate,
        );

      const requests =
        getManualCarryOverRequests(
          reconciliation,
        );

      expect(requests).toHaveLength(
        1,
      );

      expect(requests[0]).toMatchObject(
        {
          itemId:
            "manual-booking",
          section: "features",
          label:
            "Custom booking flow",
        },
      );
    });

    it("does not treat a removed item as a normal missing item", () => {
      const base =
        emptyBase();

      base.features.push({
        ...manualItem(
          "removed-feature",
          "Old dashboard",
        ),
        status: "removed",
        removal: {
          rationale:
            "Removed from the project",
          referenceId:
            "CALL-002",
        },
      } as NormalizedScope["features"][number]);

      const candidate = {
        ...emptyCandidate(),
        features: [
          {
            title: "Old dashboard",
            sourceReferences: [
              {
                quote:
                  "The website will include the old dashboard.",
              },
            ],
          },
        ],
      } as ExtractedScope;

      const reconciliation =
        reviewData(
          base,
          candidate,
        );

      expect(
        reconciliation.unresolved,
      ).toHaveLength(1);

      expect(
        reconciliation.unresolved[0]
          .reason,
      ).toBe(
        "REMOVED_ITEM_REAPPEARED",
      );
    });

    it("keeps review reconstruction deterministic for repeated reads", () => {
      const base =
        emptyBase();

      const candidate = {
        ...emptyCandidate(),
        deliverables: [
          {
            title: "New page",
            sourceReferences: [
              {
                quote:
                  "The agency will add a new page.",
              },
            ],
          },
        ],
      } as ExtractedScope;

      const first =
        reviewData(
          base,
          candidate,
        );

      const second =
        reviewData(
          base,
          candidate,
        );

      expect(
        first.scope.deliverables[0].relation,
      ).toBe("ADDED");

      expect(
        second.scope.deliverables[0].relation,
      ).toBe("ADDED");
    });
  },
);