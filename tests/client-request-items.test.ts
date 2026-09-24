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
  getCurrentOrganizationId: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentOrganizationId,
}));

import { prisma } from "@/lib/db";
import {
  createClientRequest,
  createClientRequestItem,
  getClientRequest,
  getClientRequestItems,
} from "@/lib/requests";

const createdOrganizationIds: string[] = [];
const createdProjectIds: string[] = [];

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function createTestOrganization() {
  const id = uniqueId("request-item-test-org");

  const organization = await prisma.organization.create({
    data: {
      id,
      name: `Request Item Test ${id}`,
      slug: uniqueId("request-item-test-slug"),
    },
  });

  createdOrganizationIds.push(organization.id);

  return organization;
}

async function createTestProject(organizationId: string) {
  const client = await prisma.client.create({
    data: {
      name: "Request Item Test Client",
      organizationId,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: `Request Item Test Project ${uniqueId("project")}`,
      value: 10000,
      organizationId,
      clientId: client.id,
    },
  });

  createdProjectIds.push(project.id);

  return project;
}

async function createApprovedBaseline(projectId: string) {
  return prisma.scopeBaseline.create({
    data: {
      projectId,
      version: 1,
      status: "APPROVED",
      sourceType: "PASTE",
      sourceText: "Test SOW",
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

async function createTestRequest(projectId: string) {
  getCurrentOrganizationId.mockResolvedValue(
    (await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { organizationId: true },
    })).organizationId,
  );

  return createClientRequest({
    projectId,
    originalText: "Add reports, change the hero video, and add Stripe.",
  });
}

describe("ClientRequestItem persistence", () => {
  beforeEach(() => {
    getCurrentOrganizationId.mockReset();
  });

  afterEach(async () => {
    if (createdProjectIds.length > 0) {
      await prisma.project.deleteMany({
        where: { id: { in: createdProjectIds } },
      });
    }

    if (createdOrganizationIds.length > 0) {
      await prisma.client.deleteMany({
        where: { organizationId: { in: createdOrganizationIds } },
      });

      await prisma.organization.deleteMany({
        where: { id: { in: createdOrganizationIds } },
      });
    }

    createdProjectIds.length = 0;
    createdOrganizationIds.length = 0;
  });

  it("persists ordered atomic items under one case file", async () => {
    const organization = await createTestOrganization();
    const project = await createTestProject(organization.id);
    await createApprovedBaseline(project.id);

    getCurrentOrganizationId.mockResolvedValue(organization.id);

    const request = await createClientRequest({
      projectId: project.id,
      originalText: "Add reports, change the hero video, and add Stripe.",
    });

    const item3 = await createClientRequestItem({
      clientRequestId: request.id,
      position: 3,
      text: "Add Stripe integration",
    });

    const item1 = await createClientRequestItem({
      clientRequestId: request.id,
      position: 1,
      text: "Add downloadable reports",
    });

    const item2 = await createClientRequestItem({
      clientRequestId: request.id,
      position: 2,
      text: "Change the hero video",
    });

    const items = await getClientRequestItems(request.id);

    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(items.map((item) => item.text)).toEqual([
      "Add downloadable reports",
      "Change the hero video",
      "Add Stripe integration",
    ]);
    expect(item1.clientRequestId).toBe(request.id);
    expect(item2.clientRequestId).toBe(request.id);
    expect(item3.clientRequestId).toBe(request.id);

    const storedRequest = await getClientRequest(project.id, request.id);

    expect(storedRequest?.items.map((item) => item.text)).toEqual([
      "Add downloadable reports",
      "Change the hero video",
      "Add Stripe integration",
    ]);
  });

  it("rejects empty item text and invalid positions", async () => {
    const organization = await createTestOrganization();
    const project = await createTestProject(organization.id);
    await createApprovedBaseline(project.id);

    getCurrentOrganizationId.mockResolvedValue(organization.id);

    const request = await createTestRequest(project.id);

    await expect(
      createClientRequestItem({
        clientRequestId: request.id,
        position: 0,
        text: "Add reports",
      }),
    ).rejects.toThrow("positive integer");

    await expect(
      createClientRequestItem({
        clientRequestId: request.id,
        position: 1,
        text: "   ",
      }),
    ).rejects.toThrow("cannot be empty");
  });

  it("prevents duplicate positions within a case file", async () => {
    const organization = await createTestOrganization();
    const project = await createTestProject(organization.id);
    await createApprovedBaseline(project.id);

    getCurrentOrganizationId.mockResolvedValue(organization.id);

    const request = await createTestRequest(project.id);

    await createClientRequestItem({
      clientRequestId: request.id,
      position: 1,
      text: "Add reports",
    });

    await expect(
      createClientRequestItem({
        clientRequestId: request.id,
        position: 1,
        text: "Add Stripe",
      }),
    ).rejects.toThrow();
  });

  it("enforces organization isolation for item reads and writes", async () => {
    const organizationA = await createTestOrganization();
    const organizationB = await createTestOrganization();
    const projectA = await createTestProject(organizationA.id);
    await createApprovedBaseline(projectA.id);

    getCurrentOrganizationId.mockResolvedValue(organizationA.id);

    const request = await createTestRequest(projectA.id);

    await createClientRequestItem({
      clientRequestId: request.id,
      position: 1,
      text: "Add reports",
    });

    getCurrentOrganizationId.mockResolvedValue(organizationB.id);

    await expect(
      createClientRequestItem({
        clientRequestId: request.id,
        position: 2,
        text: "Cross-organization item",
      }),
    ).rejects.toThrow("Client request not found.");

    const hiddenItems = await getClientRequestItems(request.id);

    expect(hiddenItems).toHaveLength(0);
  });
});
