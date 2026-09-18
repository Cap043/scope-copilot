import { beforeEach, describe, expect, it, vi } from "vitest";

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
    },
  },
  mockGetCurrentOrganizationId: vi.fn(),
  mockExtractScope: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId: mockGetCurrentOrganizationId,
}));

vi.mock("@/lib/ai/scope/extract", () => ({
  extractScope: mockExtractScope,
}));

import { createScopeBaseline } from "@/lib/scope";

describe("createScopeBaseline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists the validated normalized scope", async () => {
    const normalizedScope = {
      deliverables: [
        {
          title: "Homepage",
          sourceReferences: [{ quote: "homepage" }],
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

    mockGetCurrentOrganizationId.mockResolvedValue("org-1");

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "project-1",
    });

    mockExtractScope.mockResolvedValue(normalizedScope);

    mockPrisma.scopeBaseline.findFirst.mockResolvedValue({
      version: 2,
    });

    mockPrisma.scopeBaseline.create.mockResolvedValue({
      id: "baseline-3",
      version: 3,
    });

    const result = await createScopeBaseline({
      projectId: "project-1",
      sourceText: "The website will include a homepage.",
    });

    expect(mockExtractScope).toHaveBeenCalledWith(
      "The website will include a homepage.",
    );

    expect(mockPrisma.scopeBaseline.create).toHaveBeenCalledWith({
      data: {
        projectId: "project-1",
        version: 3,
        status: "DRAFT",
        sourceType: "PASTE",
        sourceText: "The website will include a homepage.",
        structuredScope: expect.objectContaining({
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
        type: "document_extraction",
      },
      status: "active",
    }),
  ],
  features: [],
  exclusions: [],
  clientResponsibilities: [],
  revisionLimits: [],
  timeline: expect.any(Object),
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
    mockGetCurrentOrganizationId.mockResolvedValue("org-1");

    mockPrisma.project.findFirst.mockResolvedValue(null);

    await expect(
      createScopeBaseline({
        projectId: "project-1",
        sourceText: "Some valid SOW text.",
      }),
    ).rejects.toThrow("Project not found.");

    expect(mockExtractScope).not.toHaveBeenCalled();
    expect(mockPrisma.scopeBaseline.create).not.toHaveBeenCalled();
  });

  it("does not create a baseline when extraction fails", async () => {
    mockGetCurrentOrganizationId.mockResolvedValue("org-1");

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "project-1",
    });

    mockExtractScope.mockRejectedValue(
      new Error("Gemini extraction failed."),
    );

    await expect(
      createScopeBaseline({
        projectId: "project-1",
        sourceText: "Some valid SOW text.",
      }),
    ).rejects.toThrow("Gemini extraction failed.");

    expect(mockPrisma.scopeBaseline.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.scopeBaseline.create).not.toHaveBeenCalled();
  });
});