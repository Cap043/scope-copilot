import { describe, expect, it } from "vitest";

import {
  normalizedScopeSchema,
  type NormalizedScope,
} from "@/lib/scope-schema";

describe("normalizedScopeSchema", () => {
  it("accepts a valid normalized scope", () => {
    const scope: NormalizedScope = {
      deliverables: [
        {
          title: "Responsive website",
          description: "Website for desktop, tablet, and mobile.",
          sourceReferences: [
            {
              quote: "Responsive website for desktop, tablet, and mobile.",
              section: "2. Deliverables",
            },
          ],
        },
      ],
      features: [
        {
          title: "Contact form",
          description: "Form submissions are sent to the client's email.",
          sourceReferences: [
            {
              quote: "Contact form with name, email, phone number, and message.",
              section: "3. Features",
            },
          ],
        },
      ],
      exclusions: [
        {
          title: "Online class booking",
          description: "Online booking is explicitly excluded.",
          sourceReferences: [
            {
              quote: "Online class booking.",
              section: "6. Exclusions",
            },
          ],
        },
      ],
      clientResponsibilities: [
  {
    title: "Client-provided content",
    description: "The client provides the required website content and assets.",
    sourceReferences: [
      {
        quote:
          "The client will provide the logo, brand colors, photography, trainer information, and written content.",
        section: "4. Design",
      },
    ],
  },
],
      revisionLimits: [
        {
          type: "Design revisions",
          limit: "2 rounds",
          sourceReferences: [
            {
              quote: "Up to 2 rounds of design revisions.",
              section: "5. Revisions",
            },
          ],
        },
      ],
      timeline: {
        duration: "5 weeks",
        startCondition: "After project kickoff and receipt of required content and assets.",
        dependencies: ["Client content", "Client approvals"],
        sourceReferences: [
          {
            quote: "Estimated project duration: 5 weeks.",
            section: "8. Timeline",
          },
        ],
      },
      assumptions: [
        {
          statement: "The website will contain approximately 6 primary pages.",
          sourceReferences: [
            {
              quote: "The website will contain approximately 6 primary pages.",
              section: "10. Assumptions",
            },
          ],
        },
      ],
    };

    expect(normalizedScopeSchema.safeParse(scope).success).toBe(true);
  });

  it("rejects a scope item without a title", () => {
    const result = normalizedScopeSchema.safeParse({
      deliverables: [
        {
          description: "Something without a title",
          sourceReferences: [],
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
    const result = normalizedScopeSchema.safeParse({
      deliverables: [],
      features: [],
    });

    expect(result.success).toBe(false);
  });
});