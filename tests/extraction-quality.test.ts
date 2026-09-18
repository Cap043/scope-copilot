import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  generateStructuredOutput,
} = vi.hoisted(() => ({
  generateStructuredOutput:
    vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  geminiProvider: {
    generateStructuredOutput,
  },
}));

import { extractScope } from "@/lib/ai/scope/extract";

describe("SOW extraction quality", () => {
  it("keeps comma-separated features atomic", async () => {
    const sourceText = `
The website will include five features: contact form, Google Maps,
Google Analytics, SEO metadata, and newsletter signup.
`;

    generateStructuredOutput.mockResolvedValueOnce(
      {
        deliverables: [],

        features: [
          {
            title: "Contact form",
            description: undefined,
            sourceReferences: [
              {
                quote: "contact form",
              },
            ],
          },
          {
            title: "Google Maps",
            description: undefined,
            sourceReferences: [
              {
                quote: "Google Maps",
              },
            ],
          },
          {
            title: "Google Analytics",
            description:
              undefined,
            sourceReferences: [
              {
                quote:
                  "Google Analytics",
              },
            ],
          },
          {
            title: "SEO metadata",
            description:
              undefined,
            sourceReferences: [
              {
                quote:
                  "SEO metadata",
              },
            ],
          },
          {
            title: "newsletter signup",
            description:
              undefined,
            sourceReferences: [
              {
                quote:
                  "newsletter signup",
              },
            ],
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
      },
    );

    const result =
      await extractScope(
        sourceText,
      );

    expect(result.features).toHaveLength(
      5,
    );
  });

  it("does not duplicate the same source quote across categories", async () => {
    const sourceText = `
The client will provide the final website content before implementation.
The project assumes final content is available before implementation.
`;

    generateStructuredOutput.mockResolvedValueOnce(
      {
        deliverables: [],
        features: [],
        exclusions: [],

        clientResponsibilities: [
          {
            title:
              "Client provides final website content",
            sourceReferences: [
              {
                quote:
                  "The client will provide the final website content before implementation.",
              },
            ],
          },
        ],

        revisionLimits: [],

        timeline: {
          dependencies: [],
          sourceReferences: [],
        },

        assumptions: [
          {
            statement:
              "Final content is available before implementation.",
            sourceReferences: [
              {
                quote:
                  "The project assumes final content is available before implementation.",
              },
            ],
          },
        ],
      },
    );

    const result =
      await extractScope(
        sourceText,
      );

    const quotes = [
      ...result.deliverables.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),

      ...result.features.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),

      ...result.exclusions.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),

      ...result.clientResponsibilities.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),

      ...result.revisionLimits.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),

      ...result.timeline.sourceReferences.map(
        (reference) =>
          reference.quote,
      ),

      ...result.assumptions.flatMap(
        (item) =>
          item.sourceReferences.map(
            (reference) =>
              reference.quote,
          ),
      ),
    ];

    expect(
      new Set(quotes).size,
    ).toBe(quotes.length);
  });

  it("rejects duplicate evidence when the same quote appears in multiple categories", async () => {
    const sourceText =
      "The client will provide the final website content.";

    generateStructuredOutput.mockResolvedValueOnce(
      {
        deliverables: [],
        features: [],
        exclusions: [],

        clientResponsibilities: [
          {
            title:
              "Client provides website content",
            sourceReferences: [
              {
                quote:
                  "The client will provide the final website content.",
              },
            ],
          },
        ],

        revisionLimits: [],

        timeline: {
          dependencies: [],
          sourceReferences: [],
        },

        assumptions: [
          {
            statement:
              "Website content is available before implementation.",
            sourceReferences: [
              {
                quote:
                  "The client will provide the final website content.",
              },
            ],
          },
        ],
      },
    );

    await expect(
      extractScope(sourceText),
    ).rejects.toThrow(
      "Gemini returned invalid source references.",
    );
  });
});