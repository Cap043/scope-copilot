import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getCurrentOrganizationId,
} = vi.hoisted(() => ({
  getCurrentOrganizationId:
    vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId,
}));

import { prisma } from "@/lib/db";

import {
  createClientRequest,
  getClientRequest,
  getClientRequests,
} from "@/lib/requests";

const createdOrganizationIds: string[] = [];
const createdProjectIds: string[] = [];

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function createTestOrganization() {
  const id = uniqueId("request-test-org");

  const organization =
    await prisma.organization.create({
      data: {
        id,
        name: `Request Test ${id}`,
        slug: uniqueId("request-test-slug"),
      },
    });

  createdOrganizationIds.push(
    organization.id,
  );

  return organization;
}

async function createTestProject(
  organizationId: string,
) {
  const client =
    await prisma.client.create({
      data: {
        name: "Request Test Client",
        organizationId,
      },
    });

  const project =
    await prisma.project.create({
      data: {
        name: `Request Test Project ${uniqueId("project")}`,
        value: 10000,
        organizationId,
        clientId: client.id,
      },
    });

  createdProjectIds.push(project.id);

  return project;
}

async function createApprovedBaseline(
  projectId: string,
  version: number,
) {
  return prisma.scopeBaseline.create({
    data: {
      projectId,
      version,
      status: "APPROVED",
      sourceType: "PASTE",
      sourceText: `Test SOW version ${version}`,
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
      approvedAt: new Date(),
    },
  });
}

describe("ClientRequest persistence", () => {
  beforeEach(() => {
    getCurrentOrganizationId.mockReset();
  });

  afterEach(async () => {
    if (createdProjectIds.length > 0) {
      await prisma.clientRequest.deleteMany({
        where: {
          projectId: {
            in: createdProjectIds,
          },
        },
      });

      await prisma.project.deleteMany({
        where: {
          id: {
            in: createdProjectIds,
          },
        },
      });
    }

    if (createdOrganizationIds.length > 0) {
      await prisma.client.deleteMany({
        where: {
          organizationId: {
            in: createdOrganizationIds,
          },
        },
      });

      await prisma.organization.deleteMany({
        where: {
          id: {
            in: createdOrganizationIds,
          },
        },
      });
    }

    createdProjectIds.length = 0;
    createdOrganizationIds.length = 0;
  });

  it("persists the exact request and pins the latest approved baseline", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    await createApprovedBaseline(
      project.id,
      1,
    );

    await createApprovedBaseline(
      project.id,
      3,
    );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const originalText =
      "  Can you also add downloadable monthly reports?\n\nPlease keep the same dashboard layout.  ";

    const request =
      await createClientRequest({
        projectId: project.id,
        originalText,
      });

    expect(request.projectId).toBe(
      project.id,
    );

    expect(
      request.originalText,
    ).toBe(originalText);

    expect(
      request.baselineVersion,
    ).toBe(3);

    expect(
      request.status,
    ).toBe("NEW");

    const stored =
      await getClientRequest(
        project.id,
        request.id,
      );

    expect(stored).not.toBeNull();

    expect(
      stored?.originalText,
    ).toBe(originalText);

    expect(
      stored?.analyzedAgainstBaseline
        .version,
    ).toBe(3);
  });

  it("refuses to create a request without an approved baseline", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    await expect(
      createClientRequest({
        projectId: project.id,
        originalText:
          "Please add a testimonials section.",
      }),
    ).rejects.toThrow(
      "An approved scope baseline is required before capturing a client request.",
    );

    const requests =
      await prisma.clientRequest.findMany({
        where: {
          projectId: project.id,
        },
      });

    expect(requests).toHaveLength(0);
  });

  it("pins each new request to the approved baseline that is current at capture time", async () => {
    const organization =
      await createTestOrganization();

    const project =
      await createTestProject(
        organization.id,
      );

    const baselineV1 =
      await createApprovedBaseline(
        project.id,
        1,
      );

    getCurrentOrganizationId.mockResolvedValue(
      organization.id,
    );

    const requestV1 =
      await createClientRequest({
        projectId: project.id,
        originalText:
          "Please add a pricing page.",
      });

    expect(
      requestV1.analyzedAgainstBaselineId,
    ).toBe(baselineV1.id);

    // A new approved scope becomes the future reference.
    // The existing request must remain pinned to v1.
    const baselineV2 =
      await createApprovedBaseline(
        project.id,
        2,
      );

    const requestV2 =
      await createClientRequest({
        projectId: project.id,
        originalText:
          "Please add a comparison table.",
      });

    expect(
      requestV2.analyzedAgainstBaselineId,
    ).toBe(baselineV2.id);

    const oldRequest =
      await getClientRequest(
        project.id,
        requestV1.id,
      );

    expect(
      oldRequest
        ?.analyzedAgainstBaseline
        .version,
    ).toBe(1);
  });

  it("enforces organization isolation for create and reads", async () => {
    const organizationA =
      await createTestOrganization();

    const organizationB =
      await createTestOrganization();

    const projectA =
      await createTestProject(
        organizationA.id,
      );

    await createApprovedBaseline(
      projectA.id,
      1,
    );

    getCurrentOrganizationId.mockResolvedValue(
      organizationA.id,
    );

    const request =
      await createClientRequest({
        projectId: projectA.id,
        originalText:
          "Please add a new pricing section.",
      });

    expect(request.id).toBeTruthy();

    // Switch the authenticated organization.
    getCurrentOrganizationId.mockResolvedValue(
      organizationB.id,
    );

    await expect(
      createClientRequest({
        projectId: projectA.id,
        originalText:
          "Attempted cross-organization request.",
      }),
    ).rejects.toThrow(
      "Project not found.",
    );

    const requests =
      await getClientRequests(
        projectA.id,
      );

    expect(requests).toHaveLength(0);

    const hiddenRequest =
      await getClientRequest(
        projectA.id,
        request.id,
      );

    expect(hiddenRequest).toBeNull();
  });
});