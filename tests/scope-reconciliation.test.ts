import {
  describe,
  expect,
  it,
} from "vitest";

import {
  diffScopes,
} from "@/lib/scope-diff";

import {
  reconcileScopeIdentities,
} from "@/lib/scope-reconciliation";

import type {
  ExtractedScope,
  NormalizedScope,
} from "@/lib/scope-schema";

function emptyExtractedScope(): ExtractedScope {
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

function emptyBaseScope(): NormalizedScope {
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

function documentItem(
  id: string,
  title: string,
  sourceQuote = title,
) {
  return {
    id,
    title,
    sourceReferences: [
      {
        quote: sourceQuote,
      },
    ],
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
      rationale: "Agreed with client",
      referenceId: "meeting-123",
    },
    status: "active" as const,
  };
}

describe(
  "reconcileScopeIdentities",
  () => {
    it(
      "preserves the existing ID for unchanged items",
      () => {
        const base =
          emptyBaseScope();

        base.deliverables.push(
          documentItem(
            "homepage-id",
            "Homepage",
            "The agency will build the Homepage.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.deliverables.push({
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The agency will build the Homepage.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          result.scope.deliverables,
        ).toHaveLength(1);

        expect(
          result.scope
            .deliverables[0].id,
        ).toBe(
          "homepage-id",
        );

        expect(
          result.scope
            .deliverables[0]
            .baseItemId,
        ).toBe(
          "homepage-id",
        );

        expect(
          result.scope
            .deliverables[0]
            .relation,
        ).toBe("MATCHED");

        expect(
          result.unresolved,
        ).toHaveLength(0);
      },
    );

    it(
      "preserves the existing ID when an item is modified",
      () => {
        const base =
          emptyBaseScope();

        base.features.push(
          documentItem(
            "contact-form-id",
            "Contact form",
            "The website includes a contact form.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.features.push({
          title: "Contact form",
          description:
            "Collects name, email, and phone.",
          sourceReferences: [
            {
              quote:
                "The website includes a contact form collecting name, email, and phone.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          diff.features[0].status,
        ).toBe("MODIFIED");

        expect(
          result.scope.features[0].id,
        ).toBe(
          "contact-form-id",
        );

        expect(
          result.scope.features[0]
            .relation,
        ).toBe("MATCHED");

        expect(
          result.scope.features[0]
            .description,
        ).toBe(
          "Collects name, email, and phone.",
        );
      },
    );

    it(
      "creates a new application ID for added items",
      () => {
        const base =
          emptyBaseScope();

        const candidate =
          emptyExtractedScope();

        candidate.deliverables.push({
          title: "Membership page",
          sourceReferences: [
            {
              quote:
                "The website includes a Membership page.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
            () => "generated-id-1",
          );

        expect(
          result.scope
            .deliverables[0].id,
        ).toBe(
          "generated-id-1",
        );

        expect(
          result.scope
            .deliverables[0]
            .baseItemId,
        ).toBeNull();

        expect(
          result.scope
            .deliverables[0]
            .relation,
        ).toBe("ADDED");
      },
    );

    it(
      "uses the same stable ID after fuzzy matching",
      () => {
        const base =
          emptyBaseScope();

        base.deliverables.push(
          documentItem(
            "contact-page-id",
            "Contact page",
            "The website will include a Contact page.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.deliverables.push({
          title: "Contact Us page",
          sourceReferences: [
            {
              quote:
                "The website will include a Contact Us page.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          diff.deliverables[0]
            .matchMethod,
        ).toBe("fuzzy");

        expect(
          result.scope
            .deliverables[0].id,
        ).toBe(
          "contact-page-id",
        );

        expect(
          result.scope
            .deliverables[0]
            .baseItemId,
        ).toBe(
          "contact-page-id",
        );
      },
    );

    it(
      "does not silently materialize missing active items",
      () => {
        const base =
          emptyBaseScope();

        base.features.push(
          documentItem(
            "maps-id",
            "Google Maps",
            "The website includes Google Maps.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          result.scope.features,
        ).toHaveLength(0);

        expect(
          result.unresolved,
        ).toHaveLength(1);

        expect(
          result.unresolved[0].reason,
        ).toBe(
          "MISSING_ACTIVE_ITEM",
        );

        expect(
          result.unresolved[0]
            .entry.baseItemId,
        ).toBe(
          "maps-id",
        );
      },
    );

    it(
      "flags missing manual amendments for later carry-over handling",
      () => {
        const base =
          emptyBaseScope();

        base.features.push(
          manualItem(
            "yelp-id",
            "Yelp integration",
          ),
        );

        const candidate =
          emptyExtractedScope();

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          result.scope.features,
        ).toHaveLength(0);

        expect(
          result.unresolved,
        ).toHaveLength(1);

        expect(
          result.unresolved[0]
            .reason,
        ).toBe(
          "MISSING_ACTIVE_ITEM",
        );

        expect(
          result.unresolved[0]
            .entry
            .requiresCarryOverDecision,
        ).toBe(true);
      },
    );

    it(
      "does not automatically resurrect a removed item",
      () => {
        const base =
          emptyBaseScope();

        base.features.push({
          id: "removed-booking-id",
          title: "Online class booking",
          sourceReferences: [
            {
              quote:
                "Online class booking is included.",
            },
          ],
          provenance: {
            type:
              "document_extraction",
          },
          status: "removed",
          removal: {
            rationale:
              "Removed from previous version",
            referenceId:
              "email-123",
          },
        });

        const candidate =
          emptyExtractedScope();

        candidate.features.push({
          title: "Online class booking",
          sourceReferences: [
            {
              quote:
                "Online class booking is included in the revised scope.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          result.scope.features,
        ).toHaveLength(0);

        expect(
          result.unresolved,
        ).toHaveLength(1);

        expect(
          result.unresolved[0]
            .reason,
        ).toBe(
          "REMOVED_ITEM_REAPPEARED",
        );

        expect(
          result.unresolved[0]
            .entry
            .baseItemId,
        ).toBe(
          "removed-booking-id",
        );
      },
    );

    it(
      "handles identity reconciliation independently across sections",
      () => {
        const base =
          emptyBaseScope();

        base.deliverables.push(
          documentItem(
            "home-id",
            "Homepage",
            "The website includes a Homepage.",
          ),
        );

        base.features.push(
          documentItem(
            "form-id",
            "Contact form",
            "The website includes a Contact form.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.deliverables.push({
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website includes a Homepage.",
            },
          ],
        });

        candidate.features.push({
          title: "Contact form",
          sourceReferences: [
            {
              quote:
                "The website includes a Contact form.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        const result =
          reconcileScopeIdentities(
            base,
            candidate,
            diff,
          );

        expect(
          result.scope.deliverables[0].id,
        ).toBe(
          "home-id",
        );

        expect(
          result.scope.features[0].id,
        ).toBe(
          "form-id",
        );

        expect(
          result.unresolved,
        ).toHaveLength(0);
      },
    );
  },
);