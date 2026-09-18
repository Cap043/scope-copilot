import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  mockPrisma,
  mockGetCurrentOrganizationId,
  mockExtractScope,
} = vi.hoisted(() => ({
  mockPrisma: {
    project: {
      findFirst: vi.fn(),
    },
    scopeBaseline: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGetCurrentOrganizationId:
    vi.fn(),
  mockExtractScope: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId:
    mockGetCurrentOrganizationId,
}));

vi.mock("@/lib/ai/scope/extract", () => ({
  extractScope: mockExtractScope,
}));

import {
  addManualScopeItem,
  amendScopeItem,
  amendScopeTimeline,
  approveScopeBaseline,
  createScopeBaseline,
  createScopeVersion,
  removeScopeItem,
} from "@/lib/scope";

describe("scope domain operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists the validated normalized scope", async () => {
    const normalizedScope = {
      deliverables: [
        {
          title: "Homepage",
          sourceReferences: [
            { quote: "homepage" },
          ],
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

    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "project-1",
    });

    mockExtractScope.mockResolvedValue(
      normalizedScope,
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        version: 2,
      },
    );

    mockPrisma.scopeBaseline.create.mockResolvedValue(
      {
        id: "baseline-3",
        version: 3,
      },
    );

    const result =
      await createScopeBaseline({
        projectId: "project-1",
        sourceText:
          "The website will include a homepage.",
      });

    expect(
      mockExtractScope,
    ).toHaveBeenCalledWith(
      "The website will include a homepage.",
    );

    expect(
      mockPrisma.scopeBaseline.create,
    ).toHaveBeenCalledWith({
      data: {
        projectId: "project-1",
        version: 3,
        status: "DRAFT",
        sourceType: "PASTE",
        sourceText:
          "The website will include a homepage.",
        structuredScope:
          expect.objectContaining({
            deliverables: [
              expect.objectContaining({
                title: "Homepage",
                sourceReferences: [
                  {
                    quote: "homepage",
                  },
                ],
                id: expect.any(String),
                provenance: {
                  type:
                    "document_extraction",
                },
                status: "active",
              }),
            ],
            features: [],
            exclusions: [],
            clientResponsibilities:
              [],
            revisionLimits: [],
            timeline:
              expect.any(Object),
            assumptions: [],
          }),
      },
    });

    expect(result).toEqual({
      id: "baseline-3",
      version: 3,
    });
  });

  it("does not create a baseline when the project is not accessible", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.project.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      createScopeBaseline({
        projectId: "project-1",
        sourceText:
          "Some valid SOW text.",
      }),
    ).rejects.toThrow(
      "Project not found.",
    );

    expect(
      mockExtractScope,
    ).not.toHaveBeenCalled();

    expect(
      mockPrisma.scopeBaseline.create,
    ).not.toHaveBeenCalled();
  });

  it("does not create a baseline when extraction fails", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "project-1",
    });

    mockExtractScope.mockRejectedValue(
      new Error(
        "Gemini extraction failed.",
      ),
    );

    await expect(
      createScopeBaseline({
        projectId: "project-1",
        sourceText:
          "Some valid SOW text.",
      }),
    ).rejects.toThrow(
      "Gemini extraction failed.",
    );

    expect(
      mockPrisma.scopeBaseline.findFirst,
    ).not.toHaveBeenCalled();

    expect(
      mockPrisma.scopeBaseline.create,
    ).not.toHaveBeenCalled();
  });

  it("creates the next draft version while preserving stable IDs", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "project-1",
    });

    const approvedScope = {
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
            type:
              "document_extraction" as const,
          },
          status: "active" as const,
        },
      ],
      features: [],
      exclusions: [],
      clientResponsibilities: [],
      revisionLimits: [],
      timeline: {
        duration: "5 weeks",
        dependencies: [],
        sourceReferences: [
          {
            quote:
              "The project lasts 5 weeks.",
          },
        ],
        provenance: {
          type:
            "document_extraction" as const,
        },
      },
      assumptions: [],
    };

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-1",
        version: 1,
        status: "APPROVED",
        sourceType: "PASTE",
        sourceText:
          "The website includes a homepage. The project lasts 5 weeks.",
        structuredScope:
          approvedScope,
      },
    );

    mockPrisma.scopeBaseline.create.mockResolvedValue(
      {
        id: "baseline-2",
        version: 2,
      },
    );

    await createScopeVersion(
      "project-1",
    );

    expect(
      mockPrisma.scopeBaseline.create,
    ).toHaveBeenCalledWith({
      data: {
        projectId: "project-1",
        version: 2,
        status: "DRAFT",
        sourceType: "PASTE",
        sourceText:
          "The website includes a homepage. The project lasts 5 weeks.",
        structuredScope: expect.objectContaining({
          deliverables: [
            expect.objectContaining({
              id: "deliverable-1",
            }),
          ],
        }),
      },
    });
  });

  it("adds a manual scope item with manual provenance and no document evidence", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-2",
        projectId: "project-1",
        status: "DRAFT",
        sourceText:
          "The website includes a homepage.",
        structuredScope: {
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
      },
    );

    mockPrisma.scopeBaseline.update.mockResolvedValue(
      {
        id: "baseline-2",
      },
    );

    const result =
      await addManualScopeItem({
        baselineId: "baseline-2",
        section: "features",
        item: {
          title: "Testimonials section",
          description:
            "Client testimonials displayed on the homepage.",
        },
        rationale:
          "Added after client-requested marketing update.",
        referenceId:
          "client-request-001",
      });

    expect(result.itemId).toEqual(
      expect.any(String),
    );

    expect(
      mockPrisma.scopeBaseline.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "baseline-2",
      },
      data: {
        structuredScope:
          expect.objectContaining({
            features: [
              expect.objectContaining({
                id: result.itemId,
                title:
                  "Testimonials section",
                description:
                  "Client testimonials displayed on the homepage.",
                sourceReferences: [],
                provenance: {
                  type:
                    "manual_amendment",
                  rationale:
                    "Added after client-requested marketing update.",
                  referenceId:
                    "client-request-001",
                },
                status: "active",
              }),
            ],
          }),
      },
    });
  });

  it("amends a document-derived item while preserving its original evidence", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-2",
        projectId: "project-1",
        status: "DRAFT",
        sourceText:
          "The website includes a homepage.",
        structuredScope: {
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
      },
    );

    mockPrisma.scopeBaseline.update.mockResolvedValue(
      {
        id: "baseline-2",
      },
    );

    await amendScopeItem({
      baselineId: "baseline-2",
      section: "deliverables",
      itemId: "deliverable-1",
      changes: {
        title:
          "Homepage with hero section",
        description:
          "Updated agreed homepage structure.",
      },
      rationale:
        "Client added the hero section during review.",
      referenceId:
        "client-request-002",
    });

    expect(
      mockPrisma.scopeBaseline.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "baseline-2",
      },
      data: {
        structuredScope:
          expect.objectContaining({
            deliverables: [
              expect.objectContaining({
                id: "deliverable-1",
                title:
                  "Homepage with hero section",
                sourceReferences: [
                  {
                    quote:
                      "The website includes a homepage.",
                  },
                ],
                provenance: {
                  type:
                    "document_extraction",
                },
                status: "active",
                amendment: {
                  rationale:
                    "Client added the hero section during review.",
                  referenceId:
                    "client-request-002",
                },
              }),
            ],
          }),
      },
    });
  });

  it("tombstones an item instead of deleting it", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-2",
        projectId: "project-1",
        status: "DRAFT",
        sourceText:
          "The website includes a homepage.",
        structuredScope: {
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
      },
    );

    mockPrisma.scopeBaseline.update.mockResolvedValue(
      {
        id: "baseline-2",
      },
    );

    await removeScopeItem({
      baselineId: "baseline-2",
      section: "deliverables",
      itemId: "deliverable-1",
      rationale:
        "Homepage removed from the revised project plan.",
      referenceId:
        "client-request-003",
    });

    expect(
      mockPrisma.scopeBaseline.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "baseline-2",
      },
      data: {
        structuredScope:
          expect.objectContaining({
            deliverables: [
              expect.objectContaining({
                id: "deliverable-1",
                title: "Homepage",
                status: "removed",
                sourceReferences: [
                  {
                    quote:
                      "The website includes a homepage.",
                  },
                ],
                removal: {
                  rationale:
                    "Homepage removed from the revised project plan.",
                  referenceId:
                    "client-request-003",
                },
              }),
            ],
          }),
      },
    });
  });

  it("amends document-derived timeline without changing its evidence", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-2",
        projectId: "project-1",
        status: "DRAFT",
        sourceText:
          "The project lasts 5 weeks.",
        structuredScope: {
          deliverables: [],
          features: [],
          exclusions: [],
          clientResponsibilities: [],
          revisionLimits: [],
          timeline: {
            duration: "5 weeks",
            dependencies: [],
            sourceReferences: [
              {
                quote:
                  "The project lasts 5 weeks.",
              },
            ],
            provenance: {
              type:
                "document_extraction",
            },
          },
          assumptions: [],
        },
      },
    );

    mockPrisma.scopeBaseline.update.mockResolvedValue(
      {
        id: "baseline-2",
      },
    );

    await amendScopeTimeline({
      baselineId: "baseline-2",
      duration: "6 weeks",
      startCondition:
        "After kickoff and asset delivery.",
      dependencies: [
        "Client approvals",
      ],
      rationale:
        "Timeline extended after approved content changes.",
      referenceId:
        "client-request-004",
    });

    expect(
      mockPrisma.scopeBaseline.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "baseline-2",
      },
      data: {
        structuredScope:
          expect.objectContaining({
            timeline: expect.objectContaining({
              duration: "6 weeks",
              startCondition:
                "After kickoff and asset delivery.",
              dependencies: [
                "Client approvals",
              ],
              sourceReferences: [
                {
                  quote:
                    "The project lasts 5 weeks.",
                },
              ],
              provenance: {
                type:
                  "document_extraction",
              },
              amendment: {
                rationale:
                  "Timeline extended after approved content changes.",
                referenceId:
                  "client-request-004",
              },
            }),
          }),
      },
    });
  });

  it("rejects amendment operations on an approved baseline", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue(
      "org-1",
    );

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue(
      {
        id: "baseline-1",
        projectId: "project-1",
        status: "APPROVED",
        sourceText:
          "The website includes a homepage.",
        structuredScope: {
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
        },
      },
    );

    await expect(
      addManualScopeItem({
        baselineId: "baseline-1",
        section: "features",
        item: {
          title: "New feature",
        },
        rationale: "Test change.",
        referenceId: "test-001",
      }),
    ).rejects.toThrow(
      "Only draft scope baselines can be modified.",
    );

    expect(
      mockPrisma.scopeBaseline.update,
    ).not.toHaveBeenCalled();
  });
});