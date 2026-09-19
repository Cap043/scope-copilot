import {
  describe,
  expect,
  it,
} from "vitest";

import {
  diffScopes,
} from "@/lib/scope-diff";

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
  description?: string,
  sourceQuote = title,
) {
  return {
    id,
    title,
    ...(description
      ? { description }
      : {}),
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
  rationale = "Agreed with client",
) {
  return {
    id,
    title,
    sourceReferences: [],
    provenance: {
      type: "manual_amendment" as const,
      rationale,
      referenceId: "meeting-123",
    },
    status: "active" as const,
  };
}

describe(
  "diffScopes",
  () => {
    it(
      "detects unchanged items",
      () => {
        const base =
          emptyBaseScope();

        base.deliverables.push(
          documentItem(
            "item-homepage",
            "Homepage",
            "Responsive homepage",
            "The agency will build the Homepage.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.deliverables.push({
          title: "Homepage",
          description:
            "Responsive homepage",
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

        expect(
          diff.deliverables,
        ).toHaveLength(1);

        expect(
          diff.deliverables[0].status,
        ).toBe("UNCHANGED");

        expect(
          diff.deliverables[0].baseItemId,
        ).toBe(
          "item-homepage",
        );

        expect(
          diff.deliverables[0]
            .matchMethod,
        ).toBe("exact-key");
      },
    );

    it(
      "detects semantic modifications while preserving the base ID",
      () => {
        const base =
          emptyBaseScope();

        base.features.push(
          documentItem(
            "item-contact",
            "Contact form",
            "Collects name and email",
            "The website includes a contact form.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        candidate.features.push({
          title: "Contact form",
          description:
            "Collects name, email, and phone",
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

        expect(
          diff.features[0].status,
        ).toBe("MODIFIED");

        expect(
          diff.features[0].baseItemId,
        ).toBe(
          "item-contact",
        );
      },
    );

    it(
      "detects additions",
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
                "The website will include a Membership page.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        expect(
          diff.deliverables,
        ).toHaveLength(1);

        expect(
          diff.deliverables[0].status,
        ).toBe("ADDED");

        expect(
          diff.deliverables[0]
            .baseItemId,
        ).toBeNull();

        expect(
          diff.deliverables[0]
            .candidateIndex,
        ).toBe(0);
      },
    );

    it(
      "detects missing active items",
      () => {
        const base =
          emptyBaseScope();

        base.exclusions.push(
          documentItem(
            "item-payment",
            "Online payment processing",
            undefined,
            "Online payment processing is not included.",
          ),
        );

        const candidate =
          emptyExtractedScope();

        const diff =
          diffScopes(
            base,
            candidate,
          );

        expect(
          diff.exclusions[0].status,
        ).toBe("MISSING");

        expect(
          diff.exclusions[0]
            .baseItemId,
        ).toBe(
          "item-payment",
        );

        expect(
          diff.exclusions[0]
            .requiresCarryOverDecision,
        ).toBe(false);
      },
    );

    it(
      "marks missing manual amendments for carry-over review",
      () => {
        const base =
          emptyBaseScope();

        base.features.push(
          manualItem(
            "manual-yelp",
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

        expect(
          diff.features[0].status,
        ).toBe("MISSING");

        expect(
          diff.features[0]
            .requiresCarryOverDecision,
        ).toBe(true);
      },
    );

    it(
      "creates a conflict when a previously removed item reappears",
      () => {
        const base =
          emptyBaseScope();

        base.features.push({
          id: "removed-booking",
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
              "Removed from project scope",
            referenceId:
              "client-email-42",
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

        expect(
          diff.features[0].status,
        ).toBe("CONFLICT");

        expect(
          diff.features[0]
            .conflictType,
        ).toBe(
          "REMOVED_ITEM_REAPPEARED",
        );

        expect(
          diff.features[0]
            .baseItemId,
        ).toBe(
          "removed-booking",
        );
      },
    );

    it(
      "does not report an old removed tombstone as missing when it stays absent",
      () => {
        const base =
          emptyBaseScope();

        base.features.push({
          id: "removed-feature",
          title: "Old feature",
          sourceReferences: [
            {
              quote:
                "The old feature is included.",
            },
          ],
          provenance: {
            type:
              "document_extraction",
          },
          status: "removed",
          removal: {
            rationale:
              "Client removed this requirement",
            referenceId:
              "meeting-50",
          },
        });

        const candidate =
          emptyExtractedScope();

        const diff =
          diffScopes(
            base,
            candidate,
          );

        expect(
          diff.features,
        ).toHaveLength(0);
      },
    );

    it(
      "detects revision-limit changes by matching on revision type",
      () => {
        const base =
          emptyBaseScope();

        base.revisionLimits.push({
          id: "revision-design",
          type: "Design revisions",
          limit: "2 rounds",
          sourceReferences: [
            {
              quote:
                "The project includes 2 rounds of design revisions.",
            },
          ],
          provenance: {
            type:
              "document_extraction",
          },
          status: "active",
        });

        const candidate =
          emptyExtractedScope();

        candidate.revisionLimits.push({
          type: "Design revisions",
          limit: "3 rounds",
          sourceReferences: [
            {
              quote:
                "The project includes 3 rounds of design revisions.",
            },
          ],
        });

        const diff =
          diffScopes(
            base,
            candidate,
          );

        expect(
          diff.revisionLimits[0]
            .status,
        ).toBe("MODIFIED");

        expect(
          diff.revisionLimits[0]
            .baseItemId,
        ).toBe(
          "revision-design",
        );
      },
    );

    it(
      "detects timeline changes field by field",
      () => {
        const base =
          emptyBaseScope();

        base.timeline = {
          duration: "5 weeks",
          startCondition:
            "After kickoff",
          dependencies: [
            "Client content",
          ],
          sourceReferences: [
            {
              quote:
                "The project duration is 5 weeks.",
            },
          ],
          provenance: {
            type:
              "document_extraction",
          },
        };

        const candidate =
          emptyExtractedScope();

        candidate.timeline = {
          duration: "6 weeks",
          startCondition:
            "After kickoff",
          dependencies: [
            "Client content",
            "Hosting access",
          ],
          sourceReferences: [
            {
              quote:
                "The project duration is 6 weeks.",
            },
          ],
        };

        const diff =
          diffScopes(
            base,
            candidate,
          );

        expect(
          diff.timeline.status,
        ).toBe("MODIFIED");

        expect(
          diff.timeline.changedFields,
        ).toEqual([
          "duration",
          "dependencies",
        ]);
      },
    );
it(
  "does not fuzzy-match unrelated titles",
  () => {
    const base =
      emptyBaseScope();

    base.deliverables.push(
      documentItem(
        "contact-page",
        "Contact page",
        undefined,
        "The website will include a Contact page.",
      ),
    );

    const candidate =
      emptyExtractedScope();

    candidate.deliverables.push({
      title: "Payment processing page",
      sourceReferences: [
        {
          quote:
            "The website will include a Payment processing page.",
        },
      ],
    });

    const diff =
      diffScopes(
        base,
        candidate,
      );

    const statuses =
      diff.deliverables.map(
        (entry) => entry.status,
      );

    expect(
      statuses,
    ).toContain("MISSING");

    expect(
      statuses,
    ).toContain("ADDED");
  },
);
    it(
      "uses conservative fuzzy matching for renamed items",
      () => {
        const base =
          emptyBaseScope();

        base.deliverables.push(
          documentItem(
            "contact-page",
            "Contact page",
            undefined,
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

        expect(
          diff.deliverables[0]
            .status,
        ).toBe("MODIFIED");

        expect(
          diff.deliverables[0]
            .baseItemId,
        ).toBe(
          "contact-page",
        );

        expect(
          diff.deliverables[0]
            .matchMethod,
        ).toBe("fuzzy");
      },
    );
  },
);