import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  findMany,
  findFirst,
  getCurrentOrganizationId,
} =
  vi.hoisted(() => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    getCurrentOrganizationId:
      vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  prisma: {
    scopeBaseline: {
      findMany,
      findFirst,
    },
  },
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId,
}));

import {
  getScopeVersion,
  getScopeVersionHistory,
} from "@/lib/scope-versions";

function emptyScope() {
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

describe(
  "scope version browsing",
  () => {
    it("returns every version in descending order with current-state semantics", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findMany.mockResolvedValue([
        {
          id: "v3",
          version: 3,
          status: "DRAFT",
          sourceType: "PASTE",
          approvedAt: null,
          createdAt: new Date(
            "2026-09-20T10:00:00Z",
          ),
          updatedAt: new Date(
            "2026-09-20T10:00:00Z",
          ),
          revisionCandidates: [
            {
              status:
                "PENDING_REVIEW",
              createdAt: new Date(
                "2026-09-20T11:00:00Z",
              ),
            },
          ],
        },
        {
          id: "v2",
          version: 2,
          status: "APPROVED",
          sourceType: "PASTE",
          approvedAt: new Date(
            "2026-09-19T10:00:00Z",
          ),
          createdAt: new Date(
            "2026-09-18T10:00:00Z",
          ),
          updatedAt: new Date(
            "2026-09-19T10:00:00Z",
          ),
          revisionCandidates: [],
        },
        {
          id: "v1",
          version: 1,
          status: "APPROVED",
          sourceType: "PASTE",
          approvedAt: new Date(
            "2026-09-17T10:00:00Z",
          ),
          createdAt: new Date(
            "2026-09-16T10:00:00Z",
          ),
          updatedAt: new Date(
            "2026-09-17T10:00:00Z",
          ),
          revisionCandidates: [],
        },
      ]);

      const result =
        await getScopeVersionHistory(
          "project-1",
        );

      expect(
        result.map(
          (version) =>
            version.version,
        ),
      ).toEqual([3, 2, 1]);

      expect(result[0]).toMatchObject({
        version: 3,
        isLatest: true,
        isCurrentApproved:
          false,
        revisionCandidateStatus:
          "PENDING_REVIEW",
      });

      expect(result[1]).toMatchObject({
        version: 2,
        isLatest: false,
        isCurrentApproved:
          true,
      });

      expect(result[2]).toMatchObject({
        version: 1,
        isLatest: false,
        isCurrentApproved:
          false,
      });
    });

    it("always constrains history to the authenticated organization", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-secure",
      );

      findMany.mockResolvedValue(
        [],
      );

      await getScopeVersionHistory(
        "project-42",
      );

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: "project-42",
            project: {
              organizationId:
                "org-secure",
            },
          },
        }),
      );
    });

    it("returns an empty history when a project has no versions", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findMany.mockResolvedValue(
        [],
      );

      await expect(
        getScopeVersionHistory(
          "project-1",
        ),
      ).resolves.toEqual([]);
    });

    it("loads one exact version through the organization boundary", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findFirst.mockResolvedValue({
        id: "baseline-2",
        projectId: "project-1",
        version: 2,
        status: "APPROVED",
        sourceType: "PASTE",
        sourceText:
          "The website includes a homepage.",
        structuredScope:
          emptyScope(),
        approvedAt: new Date(
          "2026-09-19T10:00:00Z",
        ),
        createdAt: new Date(
          "2026-09-18T10:00:00Z",
        ),
        updatedAt: new Date(
          "2026-09-19T10:00:00Z",
        ),
      });

      const result =
        await getScopeVersion(
          "project-1",
          2,
        );

      expect(result).toMatchObject({
        id: "baseline-2",
        projectId: "project-1",
        version: 2,
        status: "APPROVED",
      });

      expect(result.scope).toEqual(
        emptyScope(),
      );

      expect(
        findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: "project-1",
            version: 2,
            project: {
              organizationId:
                "org-1",
            },
          },
        }),
      );
    });

    it("rejects access when the requested version does not exist", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findFirst.mockResolvedValue(
        null,
      );

      await expect(
        getScopeVersion(
          "project-1",
          99,
        ),
      ).rejects.toThrow(
        "Scope version not found.",
      );
    });

    it("rejects malformed historical scope data before showing it", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findFirst.mockResolvedValue({
        id: "baseline-bad",
        projectId: "project-1",
        version: 1,
        status: "APPROVED",
        sourceType: "PASTE",
        sourceText: "Original SOW",
        structuredScope: {
          completely: "invalid",
        },
        approvedAt: new Date(
          "2026-09-17T10:00:00Z",
        ),
        createdAt: new Date(
          "2026-09-16T10:00:00Z",
        ),
        updatedAt: new Date(
          "2026-09-17T10:00:00Z",
        ),
      });

      await expect(
        getScopeVersion(
          "project-1",
          1,
        ),
      ).rejects.toThrow(
        "Scope version structure is invalid.",
      );
    });

    it("rejects historical scope with broken source evidence", async () => {
      getCurrentOrganizationId.mockResolvedValue(
        "org-1",
      );

      findFirst.mockResolvedValue({
        id: "baseline-bad-evidence",
        projectId: "project-1",
        version: 1,
        status: "APPROVED",
        sourceType: "PASTE",
        sourceText:
          "The website includes a homepage.",
        structuredScope: {
          deliverables: [
            {
              id: "homepage",
              title: "Homepage",
              sourceReferences: [
                {
                  quote:
                    "The website includes a payment gateway.",
                },
              ],
              provenance: {
                type:
                  "document_extraction",
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
        },
        approvedAt: new Date(
          "2026-09-17T10:00:00Z",
        ),
        createdAt: new Date(
          "2026-09-16T10:00:00Z",
        ),
        updatedAt: new Date(
          "2026-09-17T10:00:00Z",
        ),
      });

      await expect(
        getScopeVersion(
          "project-1",
          1,
        ),
      ).rejects.toThrow(
        "Scope version contains invalid source references.",
      );
    });
  },
);