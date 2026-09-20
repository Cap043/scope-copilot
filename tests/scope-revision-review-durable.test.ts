import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

type Decision =
  | "CARRY_OVER"
  | "REMOVE";

type DecisionRow = {
  id: string;
  itemId: string;
  section: string;
  decision: Decision;
  actorId: string;
  createdAt: Date;
  actor: {
    name: string;
    email: string;
  };
};

const mock = vi.hoisted(() => {
  const state = {
    organizationId: "org-1",

    session: {
      user: {
        id: "user-1",
        name: "Test Reviewer",
        email: "reviewer@example.com",
      },
    },

    review: {
      id: "review-1",
      candidateId: "candidate-1",
      status: "IN_PROGRESS",
      finalizedAt: null as Date | null,
      finalizedById: null as string | null,
      createdAt: new Date(
        "2026-09-19T10:00:00.000Z",
      ),
      updatedAt: new Date(
        "2026-09-19T10:00:00.000Z",
      ),
    },

    decisions: [] as DecisionRow[],

    createdBaseline: null as {
      id: string;
      projectId: string;
      version: number;
      status: string;
      structuredScope: unknown;
    } | null,

    candidateStatus:
      "PENDING_REVIEW",

    latestDecisionId: 0,
  };

  /**
   * This is a valid approved baseline fixture.
   *
   * The timeline is intentionally empty and therefore has no provenance.
   * An empty timeline is a valid persisted state.
   */
  const manualBaseItem = {
    id: "manual-1",
    title:
      "Client provides final logo",
    description:
      "Client supplies the final approved logo assets.",
    sourceReferences: [],
    provenance: {
      type:
        "manual_amendment" as const,
      rationale:
        "Added during kickoff call.",
      referenceId:
        "CALL-001",
    },
    status: "active" as const,
  };

  const baseScope = {
    deliverables: [
      manualBaseItem,
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

  /**
   * The revised SOW intentionally omits the manual amendment.
   * That creates the exact MISSING manual-item case that requires
   * an explicit CARRY_OVER or REMOVE reviewer decision.
   */
  const candidateScope = {
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

  const baseBaseline = {
    id: "baseline-1",
    version: 1,
    status: "APPROVED",
    sourceText: "Approved SOW",
    structuredScope:
      baseScope,
  };

  const candidate = {
    id: "candidate-1",
    projectId: "project-1",
    baseBaselineId:
      "baseline-1",
    status: "PENDING_REVIEW",
    sourceType: "PASTE",
    sourceText: "Updated SOW",
    extractedScope:
      candidateScope,
    createdAt: new Date(
      "2026-09-19T10:00:00.000Z",
    ),
    updatedAt: new Date(
      "2026-09-19T10:00:00.000Z",
    ),
    baseBaseline,
  };

  function latestDecisionForItem(
    itemId: string,
  ) {
    return [...state.decisions]
      .reverse()
      .find(
        (decision) =>
          decision.itemId ===
          itemId,
      );
  }

  function getReview() {
    return {
      id: state.review.id,
      status: state.review.status,
      candidateId:
        state.review.candidateId,
      finalizedAt:
        state.review.finalizedAt,
      finalizedById:
        state.review.finalizedById,
      createdAt:
        state.review.createdAt,
      updatedAt:
        state.review.updatedAt,

      decisions:
        state.decisions.map(
          (decision) => ({
            ...decision,
          }),
        ),
    };
  }

  const prisma = {
    scopeRevisionCandidate: {
      findFirst: vi.fn(
        async () => ({
          ...candidate,
          status:
            state.candidateStatus,
        }),
      ),

      updateMany: vi.fn(
        async ({
          where,
        }: {
          where: {
            id: string;
            status: string;
          };
        }) => {
          if (
            where.id ===
              candidate.id &&
            where.status ===
              state.candidateStatus
          ) {
            state.candidateStatus =
              "RECONCILED";

            return {
              count: 1,
            };
          }

          return {
            count: 0,
          };
        },
      ),
    },

    scopeBaseline: {
      findFirst: vi.fn(
        async () => {
          return {
            ...baseBaseline,
          };
        },
      ),

      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            projectId: string;
            version: number;
            status: string;
            sourceType: string;
            sourceText: string;
            structuredScope: unknown;
          };
        }) => {
          state.createdBaseline =
            {
              id: "baseline-2",
              projectId:
                data.projectId,
              version:
                data.version,
              status:
                data.status,
              structuredScope:
                data.structuredScope,
            };

          return {
            id: "baseline-2",
            projectId:
              data.projectId,
            version:
              data.version,
            status:
              data.status,
          };
        },
      ),
    },

    revisionReview: {
      upsert: vi.fn(
        async () =>
          getReview(),
      ),

      update: vi.fn(
        async ({
          data,
        }: {
          data: {
            status?: string;
            finalizedAt?: Date;
            finalizedById?: string;
          };
        }) => {
          if (data.status) {
            state.review.status =
              data.status;
          }

          if (
            data.finalizedAt
          ) {
            state.review.finalizedAt =
              data.finalizedAt;
          }

          if (
            data.finalizedById
          ) {
            state.review.finalizedById =
              data.finalizedById;
          }

          state.review.updatedAt =
            new Date();

          return getReview();
        },
      ),
    },

    revisionReviewDecision: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: {
            reviewId: string;
            itemId: string;
          };
        }) => {
          return (
            latestDecisionForItem(
              where.itemId,
            ) ?? null
          );
        },
      ),

      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            reviewId: string;
            itemId: string;
            section: string;
            decision: Decision;
            actorId: string;
          };
        }) => {
          state.latestDecisionId +=
            1;

          const row: DecisionRow =
            {
              id: `decision-${state.latestDecisionId}`,
              itemId:
                data.itemId,
              section:
                data.section,
              decision:
                data.decision,
              actorId:
                data.actorId,
              createdAt:
                new Date(
                  "2026-09-19T10:00:00.000Z",
                ),
              actor: {
                name:
                  state.session
                    .user.name,
                email:
                  state.session
                    .user.email,
              },
            };

          state.decisions.push(
            row,
          );

          return row;
        },
      ),

      findMany: vi.fn(
        async () => {
          return state.decisions.map(
            ({
              id,
              itemId,
              section,
              decision,
              actorId,
              createdAt,
            }) => ({
              id,
              itemId,
              section,
              decision,
              actorId,
              createdAt,
            }),
          );
        },
      ),
    },

    $transaction: vi.fn(
      async (
        callback: (
          tx: typeof prisma,
        ) => Promise<unknown>,
      ) => {
        return callback(prisma);
      },
    ),
  };

  return {
    state,
    prisma,
  };
});

vi.mock(
  "@/lib/db",
  () => ({
    prisma: mock.prisma,
  }),
);

vi.mock(
  "@/lib/auth-session",
  () => ({
    getCurrentOrganizationId:
      vi.fn(
        async () =>
          mock.state.organizationId,
      ),
  }),
);

vi.mock(
  "@/lib/organization-access",
  () => ({
    getCurrentSession:
      vi.fn(
        async () =>
          mock.state.session,
      ),
  }),
);

import {
  getScopeRevisionReview,
  saveScopeRevisionDecision,
} from "@/lib/scope-revision-review";

import {
  finalizeScopeRevisionCandidate,
} from "@/lib/scope-revision";

describe(
  "durable scope revision review",
  () => {
    beforeEach(() => {
      mock.state.decisions.length =
        0;

      mock.state.candidateStatus =
        "PENDING_REVIEW";

      mock.state.createdBaseline =
        null;

      mock.state.latestDecisionId =
        0;

      mock.state.review.status =
        "IN_PROGRESS";

      mock.state.review.finalizedAt =
        null;

      mock.state.review.finalizedById =
        null;

      mock.state.review.updatedAt =
        mock.state.review.createdAt;

      vi.clearAllMocks();
    });

    it("persists a reviewer decision with actor identity", async () => {
      const result =
        await saveScopeRevisionDecision(
          {
            candidateId:
              "candidate-1",
            itemId:
              "manual-1",
            decision:
              "CARRY_OVER",
          },
        );

      expect(result).toMatchObject(
        {
          itemId: "manual-1",
          decision:
            "CARRY_OVER",
          actorId: "user-1",
          actorName:
            "Test Reviewer",
          actorEmail:
            "reviewer@example.com",
        },
      );

      expect(
        mock.state.decisions,
      ).toHaveLength(1);

      expect(
        mock.state.decisions[0],
      ).toMatchObject({
        itemId: "manual-1",
        decision:
          "CARRY_OVER",
        actorId: "user-1",
      });
    });

    it("does not create duplicate history entries when the same decision is saved twice", async () => {
      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "CARRY_OVER",
        },
      );

      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "CARRY_OVER",
        },
      );

      expect(
        mock.state.decisions,
      ).toHaveLength(1);

      expect(
        mock.prisma
          .revisionReviewDecision
          .create,
      ).toHaveBeenCalledTimes(
        1,
      );
    });

    it("keeps an append-only history when a reviewer changes a decision", async () => {
      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "CARRY_OVER",
        },
      );

      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "REMOVE",
        },
      );

      expect(
        mock.state.decisions,
      ).toHaveLength(2);

      expect(
        mock.state.decisions[0],
      ).toMatchObject({
        decision:
          "CARRY_OVER",
      });

      expect(
        mock.state.decisions[1],
      ).toMatchObject({
        decision:
          "REMOVE",
      });
    });

    it("reconstructs current decisions and retains full review history after reload", async () => {
      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "CARRY_OVER",
        },
      );

      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "REMOVE",
        },
      );

      const review =
        await getScopeRevisionReview(
          "candidate-1",
        );

      expect(
        review.review
          .decisions[
          "manual-1"
        ],
      ).toBe("REMOVE");

      expect(
        review.review.history,
      ).toHaveLength(2);

      expect(
        review.review.history[0],
      ).toMatchObject({
        itemId:
          "manual-1",
        decision:
          "CARRY_OVER",
        actorId:
          "user-1",
        actorName:
          "Test Reviewer",
        actorEmail:
          "reviewer@example.com",
      });

      expect(
        review.review.history[1],
      ).toMatchObject({
        itemId:
          "manual-1",
        decision:
          "REMOVE",
        actorId:
          "user-1",
      });
    });

    it("finalizes using persisted database decisions rather than browser-supplied decisions", async () => {
      await saveScopeRevisionDecision(
        {
          candidateId:
            "candidate-1",
          itemId:
            "manual-1",
          decision:
            "CARRY_OVER",
        },
      );

      const result =
        await finalizeScopeRevisionCandidate(
          {
            candidateId:
              "candidate-1",
          },
        );

      expect(result).toMatchObject(
        {
          baselineId:
            "baseline-2",
          projectId:
            "project-1",
          version: 2,
          status: "DRAFT",
        },
      );

      expect(
        mock.state.createdBaseline,
      ).not.toBeNull();

      expect(
        mock.state.createdBaseline!
          .structuredScope,
      ).toMatchObject({
        deliverables: [
          {
            id: "manual-1",
            title:
              "Client provides final logo",
            provenance: {
              type:
                "manual_amendment",
              rationale:
                "Added during kickoff call.",
              referenceId:
                "CALL-001",
            },
            status: "active",
          },
        ],
      });

      expect(
        mock.state.candidateStatus,
      ).toBe("RECONCILED");

      expect(
        mock.state.review.status,
      ).toBe("FINALIZED");

      expect(
        mock.state.review
          .finalizedById,
      ).toBe("user-1");

      expect(
        mock.state.review
          .finalizedAt,
      ).toBeInstanceOf(Date);

      expect(
        mock.prisma
          .revisionReviewDecision
          .findMany,
      ).toHaveBeenCalledTimes(
        1,
      );
    });

    it("blocks finalization when the persisted manual decision is missing", async () => {
      await expect(
        finalizeScopeRevisionCandidate(
          {
            candidateId:
              "candidate-1",
          },
        ),
      ).rejects.toThrow(
        "The scope revision still contains unresolved changes.",
      );

      expect(
        mock.state.createdBaseline,
      ).toBeNull();

      expect(
        mock.state.candidateStatus,
      ).toBe("PENDING_REVIEW");

      expect(
        mock.state.review.status,
      ).toBe("IN_PROGRESS");
    });
  },
);