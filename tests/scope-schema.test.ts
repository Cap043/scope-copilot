import { describe, expect, it } from "vitest";

import {
  validateScopeSourceReferences,
  normalizedScopeSchema,
  type NormalizedScope,
} from "@/lib/scope-schema";

describe("normalizedScopeSchema", () => {
  it("rejects duplicate item IDs across scope sections", () => {
  const result =
    normalizedScopeSchema.safeParse({
      deliverables: [
        {
          id: "same-id",
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      features: [
        {
          id: "same-id",
          title: "Homepage feature",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage feature.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      exclusions: [],

      clientResponsibilities: [],

      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    });

  expect(result.success).toBe(false);
});
it("rejects duplicate IDs inside the same section", () => {
  const result =
    normalizedScopeSchema.safeParse({
      deliverables: [
        {
          id: "same-id",
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
        {
          id: "same-id",
          title: "About page",
          sourceReferences: [
            {
              quote:
                "The website includes an about page.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      features: [],
      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    });

  expect(result.success).toBe(false);
});

it("rejects duplicate IDs across sections", () => {
  const result =
    normalizedScopeSchema.safeParse({
      deliverables: [
        {
          id: "same-id",
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      features: [
        {
          id: "same-id",
          title: "Homepage feature",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage feature.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    });

  expect(result.success).toBe(false);
});
  it("accepts a valid document-extracted normalized scope", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          id: "deliverable-1",
          title: "Responsive website",
          description:
            "Website for desktop, tablet, and mobile.",
          sourceReferences: [
            {
              quote:
                "Responsive website for desktop, tablet, and mobile.",
              section: "2. Deliverables",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      features: [
        {
          id: "feature-1",
          title: "Contact form",
          description:
            "Form submissions are sent to the client's email.",
          sourceReferences: [
            {
              quote:
                "Contact form with name, email, phone number, and message.",
              section: "3. Features",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      exclusions: [
        {
          id: "exclusion-1",
          title: "Online class booking",
          description:
            "Online booking is explicitly excluded.",
          sourceReferences: [
            {
              quote: "Online class booking.",
              section: "6. Exclusions",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      clientResponsibilities: [
        {
          id: "responsibility-1",
          title: "Client-provided content",
          description:
            "The client provides the required website content and assets.",
          sourceReferences: [
            {
              quote:
                "The client will provide the logo, brand colors, photography, trainer information, and written content.",
              section: "4. Design",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      revisionLimits: [
        {
          id: "revision-1",
          type: "Design revisions",
          limit: "2 rounds",
          sourceReferences: [
            {
              quote:
                "Up to 2 rounds of design revisions.",
              section: "5. Revisions",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

     timeline: {
  duration: "5 weeks",
  startCondition:
    "After project kickoff and receipt of required content and assets.",
  dependencies: ["Client content", "Client approvals"],
  sourceReferences: [
    {
      quote: "Estimated project duration: 5 weeks.",
      section: "8. Timeline",
    },
  ],
  provenance: {
    type: "document_extraction",
  },
},

      assumptions: [
        {
          id: "assumption-1",
          statement:
            "The website will contain approximately 6 primary pages.",
          sourceReferences: [
            {
              quote:
                "The website will contain approximately 6 primary pages.",
              section: "10. Assumptions",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],
    };

    const result = normalizedScopeSchema.safeParse(scope);

if (!result.success) {
  console.dir(result.error.issues, { depth: null });
}

expect(result.success).toBe(true);
  });

  it("accepts a valid manual amendment without document evidence", () => {
    const scope: NormalizedScope = {
      deliverables: [],

      features: [
        {
          id: "manual-feature-1",
          title: "Booking system",
          description:
            "Booking functionality agreed after the original SOW.",
          sourceReferences: [],
          provenance: {
            type: "manual_amendment",
            rationale:
              "Agreed during client meeting.",
            referenceId: "meeting-2026-09-17",
          },
          status: "active",
        },
      ],

      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    };

    expect(
      normalizedScopeSchema.safeParse(scope).success,
    ).toBe(true);
  });

  it("rejects a document-extracted item without evidence", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [
          {
            id: "deliverable-1",
            title: "Homepage",
            sourceReferences: [],
            provenance: {
              type: "document_extraction",
            },
            status: "active",
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects a manual amendment with document source references", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [],
        features: [
          {
            id: "manual-feature-1",
            title: "Booking system",
            sourceReferences: [
              {
                quote: "Booking system",
              },
            ],
            provenance: {
              type: "manual_amendment",
              rationale:
                "Agreed during client meeting.",
              referenceId: "meeting-2026-09-17",
            },
            status: "active",
          },
        ],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects a manual amendment without a rationale", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [],
        features: [
          {
            id: "manual-feature-1",
            title: "Booking system",
            sourceReferences: [],
            provenance: {
              type: "manual_amendment",
              referenceId: "meeting-2026-09-17",
            },
            status: "active",
          },
        ],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects a manual amendment without a referenceId", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [],
        features: [
          {
            id: "manual-feature-1",
            title: "Booking system",
            sourceReferences: [],
            provenance: {
              type: "manual_amendment",
              rationale:
                "Agreed during client meeting.",
            },
            status: "active",
          },
        ],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects a removed item without removal metadata", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [
          {
            id: "deliverable-1",
            title: "Old homepage animation",
            sourceReferences: [
              {
                quote:
                  "Homepage animation is included in the project.",
              },
            ],
            provenance: {
              type: "document_extraction",
            },
            status: "removed",
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("accepts a removed item with removal metadata", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          id: "deliverable-1",
          title: "Old homepage animation",
          sourceReferences: [
            {
              quote:
                "Homepage animation is included in the project.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "removed",
          removal: {
            rationale:
              "Removed during scope renegotiation.",
            referenceId: "change-004",
          },
        },
      ],

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

    expect(
      normalizedScopeSchema.safeParse(scope).success,
    ).toBe(true);
  });

  it("rejects an active item with removal metadata", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [
          {
            id: "deliverable-1",
            title: "Homepage",
            sourceReferences: [
              {
                quote:
                  "The website includes a homepage.",
              },
            ],
            provenance: {
              type: "document_extraction",
            },
            status: "active",
            removal: {
              rationale:
                "Removed during discussion.",
              referenceId: "change-004",
            },
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects a scope item without a title", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [
          {
            id: "deliverable-1",
            description:
              "Something without a title",
            sourceReferences: [],
            provenance: {
              type: "document_extraction",
            },
            status: "active",
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(result.success).toBe(false);
  });

  it("rejects missing top-level scope sections", () => {
    const result =
      normalizedScopeSchema.safeParse({
        deliverables: [],
        features: [],
      });

    expect(result.success).toBe(false);
  });
});

describe("validateScopeSourceReferences", () => {
  it("accepts quotes that exist in the source text", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          id: "deliverable-1",
          title: "Homepage",
          description: "A responsive homepage.",
          sourceReferences: [
            {
              quote:
                "The website will include a responsive homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

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

    expect(
      validateScopeSourceReferences(
        scope,
        "The website will include a responsive homepage.",
      ),
    ).toBe(true);
  });

  it("rejects quotes that do not exist in the source text", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          id: "deliverable-1",
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website will include a payment system.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

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

    expect(
      validateScopeSourceReferences(
        scope,
        "The website will include a responsive homepage.",
      ),
    ).toBe(false);
  });

  it("ignores evidence validation for manual amendments", () => {
    const scope: NormalizedScope = {
      deliverables: [],

      features: [
        {
          id: "manual-feature-1",
          title: "Booking system",
          sourceReferences: [],
          provenance: {
            type: "manual_amendment",
            rationale:
              "Agreed during client meeting.",
            referenceId: "meeting-2026-09-17",
          },
          status: "active",
        },
      ],

      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    };

    expect(
      validateScopeSourceReferences(
        scope,
        "The SOW contains no booking system.",
      ),
    ).toBe(true);
  });

  it("rejects duplicate document evidence", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          id: "deliverable-1",
          title: "Homepage",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      features: [
        {
          id: "feature-1",
          title: "Homepage capability",
          sourceReferences: [
            {
              quote:
                "The website includes a homepage.",
            },
          ],
          provenance: {
            type: "document_extraction",
          },
          status: "active",
        },
      ],

      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],

      timeline: {
        dependencies: [],
        sourceReferences: [],
      },

      assumptions: [],
    };

    expect(
      validateScopeSourceReferences(
        scope,
        "The website includes a homepage.",
      ),
    ).toBe(false);
  });
});