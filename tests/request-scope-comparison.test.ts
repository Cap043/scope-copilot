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

import {
  compareRequestToScope,
} from "@/lib/ai/request/compare-scope";

const candidates = [
  {
    id: "feature-oauth",
    section: "features" as const,
    title:
      "OAuth2.0 Third-Party Authentication via Firebase",
    description:
      "Users can authenticate through supported third-party providers using Firebase.",
    sourceReferences: [
      {
        quote:
          "OAuth2.0 Third-Party Authentication via Firebase",
      },
    ],
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  },

  {
    id: "exclusion-third-party",
    section: "exclusions" as const,
    title:
      "Additional third-party integrations",
    description:
      "Third-party integrations outside the listed authentication and payment functionality are excluded.",
    sourceReferences: [
      {
        quote:
          "Additional third-party integrations",
      },
    ],
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  },

  {
    id: "responsibility-credentials",
    section:
      "clientResponsibilities" as const,
    title: "Client credentials",
    description:
      "Client supplies required credentials.",
    sourceReferences: [
      {
        quote:
          "Client supplies required credentials",
      },
    ],
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  },
];

describe(
  "deep scope comparison",
  () => {
    it(
      "returns a structured comparison for every candidate",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "PARTIALLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "The authentication capability requested is covered by the approved Firebase OAuth scope item.",
              },
              {
                scopeItemId:
                  "exclusion-third-party",
                relationship:
                  "EXPLICITLY_EXCLUDED",
                explanation:
                  "The request may involve additional third-party integration outside the listed authentication functionality.",
              },
              {
                scopeItemId:
                  "responsibility-credentials",
                relationship:
                  "RELATED_NOT_INCLUDED",
                explanation:
                  "The client responsibility concerns credentials needed to implement the request but does not itself include the requested feature.",
              },
            ],

            confidence: "HIGH",
          },
        );

        const result =
          await compareRequestToScope({
            clientRequestText:
              "Can users log in with their Google accounts?",
            candidates,
          });

        expect(result).toEqual({
          overallRelationship:
            "PARTIALLY_INCLUDED",

          comparisons: [
            {
              scopeItemId:
                "feature-oauth",
              relationship:
                "DIRECTLY_INCLUDED",
              explanation:
                "The authentication capability requested is covered by the approved Firebase OAuth scope item.",
            },
            {
              scopeItemId:
                "exclusion-third-party",
              relationship:
                "EXPLICITLY_EXCLUDED",
              explanation:
                "The request may involve additional third-party integration outside the listed authentication functionality.",
            },
            {
              scopeItemId:
                "responsibility-credentials",
              relationship:
                "RELATED_NOT_INCLUDED",
              explanation:
                "The client responsibility concerns credentials needed to implement the request but does not itself include the requested feature.",
            },
          ],

          confidence: "HIGH",
        });

        expect(
          generateStructuredOutput,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "passes the atomic request and canonical candidates to the AI",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",
            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "The requested authentication capability is covered.",
              },
            ],
            confidence: "HIGH",
          },
        );

        await compareRequestToScope({
          clientRequestText:
            "Can users log in with Google?",
          candidates: [
            candidates[0],
          ],
        });

        const call =
          generateStructuredOutput.mock
            .calls[0][0];

        expect(
          call.userContent,
        ).toContain(
          "Can users log in with Google?",
        );

        expect(
          call.userContent,
        ).toContain(
          "feature-oauth",
        );

        expect(
          call.userContent,
        ).toContain(
          "OAuth2.0 Third-Party Authentication via Firebase",
        );

        expect(
          call.userContent,
        ).toContain(
          "OAuth2.0 Third-Party Authentication via Firebase",
        );
      },
    );

    it(
      "returns a non-classifying empty result when there are no candidates",
      async () => {
        const result =
          await compareRequestToScope({
            clientRequestText:
              "Add a completely unrelated feature.",
            candidates: [],
          });

        expect(result).toEqual({
          overallRelationship:
            "UNRELATED",
          comparisons: [],
          confidence: "LOW",
        });

        expect(
          generateStructuredOutput,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an empty client request",
      async () => {
        await expect(
          compareRequestToScope({
            clientRequestText: "   ",
            candidates,
          }),
        ).rejects.toThrow(
          "Client request cannot be empty.",
        );
      },
    );

    it(
      "rejects duplicate candidate IDs",
      async () => {
        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          "Scope comparison candidates contain duplicate IDs.",
        );
      },
    );

    it(
      "rejects a comparison containing an unknown scope item ID",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "unknown-scope-item",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "Invented candidate.",
              },
            ],

            confidence: "HIGH",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          'Scope comparison referenced scope item ID "unknown-scope-item" that was not supplied as a candidate.',
        );
      },
    );

    it(
      "rejects a comparison that omits a supplied candidate",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "Authentication is covered.",
              },
            ],

            confidence: "HIGH",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates,
          }),
        ).rejects.toThrow(
          "Scope comparison must evaluate every supplied candidate scope item exactly once.",
        );
      },
    );

    it(
      "rejects duplicate comparison IDs",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "Authentication is covered.",
              },
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "AMBIGUOUS",
                explanation:
                  "Duplicate comparison.",
              },
            ],

            confidence: "MEDIUM",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          'Scope comparison contains duplicate scope item ID "feature-oauth".',
        );
      },
    );

    it(
      "rejects invalid relationships",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "OUT_OF_SCOPE",
                explanation:
                  "Invalid relationship vocabulary.",
              },
            ],

            confidence: "HIGH",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          'Scope comparison returned an invalid relationship for scope item "feature-oauth".',
        );
      },
    );

    it(
      "rejects an empty explanation",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation: "   ",
              },
            ],

            confidence: "HIGH",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          'Scope comparison returned an empty explanation for scope item "feature-oauth".',
        );
      },
    );

    it(
      "rejects an invalid confidence value",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "DIRECTLY_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "DIRECTLY_INCLUDED",
                explanation:
                  "Authentication is covered.",
              },
            ],

            confidence:
              "VERY_HIGH",
          },
        );

        await expect(
          compareRequestToScope({
            clientRequestText:
              "Add Google login.",
            candidates: [
              candidates[0],
            ],
          }),
        ).rejects.toThrow(
          "Scope comparison returned an invalid confidence value.",
        );
      },
    );

    it(
      "preserves candidate order in the returned comparisons",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "EXPLICITLY_EXCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "exclusion-third-party",
                relationship:
                  "EXPLICITLY_EXCLUDED",
                explanation:
                  "The requested integration is explicitly excluded.",
              },
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "RELATED_NOT_INCLUDED",
                explanation:
                  "Authentication is related but does not itself cover the requested integration.",
              },
            ],

            confidence: "HIGH",
          },
        );

        const result =
          await compareRequestToScope({
            clientRequestText:
              "Add another third-party integration.",
            candidates: [
              candidates[0],
              candidates[1],
            ],
          });

        expect(
          result.comparisons.map(
            (comparison) =>
              comparison.scopeItemId,
          ),
        ).toEqual([
          "exclusion-third-party",
          "feature-oauth",
        ]);
      },
    );
  },
);