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
      "returns NO_SCOPE_EVIDENCE without calling the AI when there are no candidates",
      async () => {
        const result =
          await compareRequestToScope({
            clientRequestText:
              "Add a completely unrelated feature.",
            candidates: [],
          });

        expect(result).toEqual({
          overallRelationship:
            "NO_SCOPE_EVIDENCE",
          comparisons: [],
        });

        expect(
          result.confidence,
        ).toBeUndefined();

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
      "rejects NO_SCOPE_EVIDENCE when candidates were supplied",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "NO_SCOPE_EVIDENCE",

            comparisons: [],

            confidence: "LOW",
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
          "NO_SCOPE_EVIDENCE is only valid when no scope candidates were supplied.",
        );
      },
    );

    it(
      "rejects NO_SCOPE_EVIDENCE for an individual candidate",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "RELATED_NOT_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "NO_SCOPE_EVIDENCE",
                explanation:
                  "No evidence.",
              },
            ],

            confidence: "LOW",
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
          'Scope comparison returned NO_SCOPE_EVIDENCE for supplied scope item "feature-oauth".',
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

    it(
      "documents the stricter partial-inclusion rule in the comparison prompt",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "RELATED_NOT_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "feature-oauth",
                relationship:
                  "RELATED_NOT_INCLUDED",
                explanation:
                  "Authentication is related context but does not explicitly support the requested Instagram feed functionality.",
              },
            ],

            confidence: "HIGH",
          },
        );

        await compareRequestToScope({
          clientRequestText:
            "Add an Instagram feed to the homepage.",
          candidates: [
            {
              ...candidates[0],
              title: "Homepage",
              description:
                "The responsive homepage is included in the approved scope.",
            },
          ],
        });

        const call =
          generateStructuredOutput.mock
            .calls[
              generateStructuredOutput.mock.calls.length - 1
            ][0];

        expect(
          call.systemInstruction,
        ).toContain(
          "A shared page, entity, product area, or contextual relationship is NOT enough.",
        );

        expect(
          call.systemInstruction,
        ).toContain(
          "The candidate must explicitly support at least one meaningful requested capability.",
        );

        expect(
          call.systemInstruction,
        ).toContain(
          "This should be RELATED_NOT_INCLUDED.",
        );
      },
    );

    it(
      "accepts RELATED_NOT_INCLUDED for homepage context without treating it as partial inclusion",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            overallRelationship:
              "RELATED_NOT_INCLUDED",

            comparisons: [
              {
                scopeItemId:
                  "homepage",
                relationship:
                  "RELATED_NOT_INCLUDED",
                explanation:
                  "The homepage is in scope, but the approved evidence does not specify an Instagram feed or social-media integration.",
              },
            ],

            confidence: "HIGH",
          },
        );

        const homepageCandidate = {
          ...candidates[0],
          id: "homepage",
          title: "Homepage",
          description:
            "Responsive homepage included in the approved scope.",
        };

        const result =
          await compareRequestToScope({
            clientRequestText:
              "Add an Instagram feed to the homepage.",
            candidates: [
              homepageCandidate,
            ],
          });

        expect(result).toEqual({
          overallRelationship:
            "RELATED_NOT_INCLUDED",

          comparisons: [
            {
              scopeItemId:
                "homepage",
              relationship:
                "RELATED_NOT_INCLUDED",
              explanation:
                "The homepage is in scope, but the approved evidence does not specify an Instagram feed or social-media integration.",
            },
          ],

          confidence: "HIGH",
        });
      },
    );
  },
);