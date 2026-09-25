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
  resolveScopeCandidateIds,
  retrieveScopeCandidateIds,
} from "@/lib/ai/request/retrieve-scope-candidates";

const approvedScope = {
  deliverables: [
    {
      id: "deliverable-1",
      title: "Customer portal",
      description:
        "A secure customer-facing portal.",
      sourceReferences: [
        {
          quote:
            "customer-facing portal",
        },
      ],
      provenance: {
        type: "document_extraction" as const,
      },
      status: "active" as const,
    },
  ],

  features: [
    {
      id: "feature-oauth",
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
      id: "feature-payments",
      title: "Online payments",
      description:
        "Payment processing through an online payment provider.",
      sourceReferences: [
        {
          quote:
            "Payment processing through an online payment provider",
        },
      ],
      provenance: {
        type: "document_extraction" as const,
      },
      status: "active" as const,
    },
  ],

  exclusions: [
    {
      id: "exclusion-third-party",
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
  ],

  clientResponsibilities: [
    {
      id: "responsibility-content",
      title: "Client content",
      description:
        "Client supplies final website content.",
      sourceReferences: [
        {
          quote:
            "Client supplies final website content",
        },
      ],
      provenance: {
        type: "document_extraction" as const,
      },
      status: "active" as const,
    },
  ],

  revisionLimits: [
    {
      id: "revision-limit-1",
      type: "design revisions",
      limit: "Two rounds",
      sourceReferences: [
        {
          quote:
            "Two rounds",
        },
      ],
      provenance: {
        type: "document_extraction" as const,
      },
      status: "active" as const,
    },
  ],

  timeline: {
    dependencies: [],
    sourceReferences: [],
  },

  assumptions: [
    {
      id: "assumption-1",
      statement:
        "Client will provide required credentials.",
      sourceReferences: [
        {
          quote:
            "Client will provide required credentials",
        },
      ],
      provenance: {
        type: "document_extraction" as const,
      },
      status: "active" as const,
    },
  ],
};

describe(
  "semantic scope candidate retrieval",
  () => {
    it(
      "returns only the scope IDs proposed by the semantic retrieval model",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            scopeItemIds: [
              "feature-oauth",
              "exclusion-third-party",
            ],
          },
        );

        const result =
          await retrieveScopeCandidateIds({
            clientRequestText:
              "Can users log in with their Google accounts?",
            approvedScope,
          });

        expect(
          result.scopeItemIds,
        ).toEqual([
          "feature-oauth",
          "exclusion-third-party",
        ]);

        expect(
          generateStructuredOutput,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "passes the complete approved scope to the AI retrieval layer",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            scopeItemIds: [],
          },
        );

        await retrieveScopeCandidateIds({
          clientRequestText:
            "Can users log in with Google?",
          approvedScope,
        });

        const call =
          generateStructuredOutput.mock.calls[0][0];

        expect(
          call.userContent,
        ).toContain(
          "Can users log in with Google?",
        );

        expect(
          call.userContent,
        ).toContain(
          "OAuth2.0 Third-Party Authentication via Firebase",
        );

        expect(
          call.userContent,
        ).toContain(
          "Online payments",
        );

        expect(
          call.userContent,
        ).toContain(
          "Additional third-party integrations",
        );

        expect(
          call.userContent,
        ).toContain(
          "Client supplies final website content",
        );
      },
    );

    it(
      "rejects an empty client request",
      async () => {
        await expect(
          retrieveScopeCandidateIds({
            clientRequestText: "   ",
            approvedScope,
          }),
        ).rejects.toThrow(
          "Client request cannot be empty.",
        );

        expect(
          generateStructuredOutput,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid approved scope",
      async () => {
        await expect(
          retrieveScopeCandidateIds({
            clientRequestText:
              "Add Google login.",
            approvedScope: {
              invalid: true,
            },
          }),
        ).rejects.toThrow(
          "Approved scope structure is invalid.",
        );

        expect(
          generateStructuredOutput,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects duplicate candidate IDs returned by the model",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            scopeItemIds: [
              "feature-oauth",
              "feature-oauth",
            ],
          },
        );

        await expect(
          retrieveScopeCandidateIds({
            clientRequestText:
              "Add Google login.",
            approvedScope,
          }),
        ).rejects.toThrow(
          "Semantic scope retrieval contains duplicate scope item IDs.",
        );
      },
    );

    it(
      "rejects non-text candidate IDs",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            scopeItemIds: [
              "feature-oauth",
              123,
            ],
          },
        );

        await expect(
          retrieveScopeCandidateIds({
            clientRequestText:
              "Add Google login.",
            approvedScope,
          }),
        ).rejects.toThrow(
          "Semantic scope retrieval contains a non-text scope item ID.",
        );
      },
    );

    it(
      "resolves valid IDs against the canonical approved scope",
      () => {
        const result =
          resolveScopeCandidateIds(
            approvedScope,
            [
              "feature-oauth",
              "exclusion-third-party",
            ],
          );

        expect(result).toHaveLength(2);

        expect(result[0]).toEqual(
          expect.objectContaining({
            id: "feature-oauth",
            section: "features",
            title:
              "OAuth2.0 Third-Party Authentication via Firebase",
            status: "active",
          }),
        );

        expect(result[1]).toEqual(
          expect.objectContaining({
            id: "exclusion-third-party",
            section: "exclusions",
            title:
              "Additional third-party integrations",
            status: "active",
          }),
        );
      },
    );

    it(
      "preserves canonical source evidence",
      () => {
        const result =
          resolveScopeCandidateIds(
            approvedScope,
            ["feature-oauth"],
          );

        expect(
          result[0].sourceReferences,
        ).toEqual([
          {
            quote:
              "OAuth2.0 Third-Party Authentication via Firebase",
          },
        ]);
      },
    );

    it(
      "rejects an ID that does not exist in the approved scope",
      () => {
        expect(() =>
          resolveScopeCandidateIds(
            approvedScope,
            ["invented-scope-id"],
          ),
        ).toThrow(
          'Semantic scope retrieval returned unknown scope item ID "invented-scope-id".',
        );
      },
    );

    it(
      "preserves removed scope items instead of silently deleting them",
      () => {
        const scopeWithRemovedItem = {
          ...approvedScope,
          features: [
            ...approvedScope.features,
            {
              id: "removed-feature",
              title:
                "Old authentication flow",
              description:
                "A previous authentication implementation.",
              sourceReferences: [
                {
                  quote:
                    "previous authentication implementation",
                },
              ],
              provenance: {
                type:
                  "document_extraction" as const,
              },
              status:
                "removed" as const,
              removal: {
                rationale:
                  "Replaced by Firebase authentication.",
                referenceId:
                  "REV-4",
              },
            },
          ],
        };

        const result =
          resolveScopeCandidateIds(
            scopeWithRemovedItem,
            ["removed-feature"],
          );

        expect(
          result[0],
        ).toEqual(
          expect.objectContaining({
            id: "removed-feature",
            status: "removed",
          }),
        );
      },
    );

    it(
      "supports revision-limit candidates",
      () => {
        const result =
          resolveScopeCandidateIds(
            approvedScope,
            ["revision-limit-1"],
          );

        expect(result[0]).toEqual(
          expect.objectContaining({
            id: "revision-limit-1",
            section: "revisionLimits",
            type: "design revisions",
            limit: "Two rounds",
          }),
        );
      },
    );

    it(
      "supports assumption candidates",
      () => {
        const result =
          resolveScopeCandidateIds(
            approvedScope,
            ["assumption-1"],
          );

        expect(result[0]).toEqual(
          expect.objectContaining({
            id: "assumption-1",
            section: "assumptions",
            statement:
              "Client will provide required credentials.",
          }),
        );
      },
    );

    it(
      "does not perform lexical filtering before semantic retrieval",
      async () => {
        generateStructuredOutput.mockResolvedValueOnce(
          {
            scopeItemIds: [
              "feature-oauth",
            ],
          },
        );

        const result =
          await retrieveScopeCandidateIds({
            clientRequestText:
              "Can users sign in with Google?",
            approvedScope,
          });

        expect(
          result.scopeItemIds,
        ).toEqual([
          "feature-oauth",
        ]);

        /*
         * The application deliberately does not attempt to determine
         * relevance from shared words. Gemini is responsible for the
         * semantic recall step.
         */
        expect(
          generateStructuredOutput,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);