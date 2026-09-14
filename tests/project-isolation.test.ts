import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

describe("project organization isolation", () => {
  let organizationA: { id: string };
  let organizationB: { id: string };
  let projectA: { id: string };

  beforeAll(async () => {
    organizationA = await prisma.organization.create({
      data: {
        id: `test-org-a-${Date.now()}`,
        name: "Test Organization A",
        slug: `test-org-a-${Date.now()}`,
      },
    });

    organizationB = await prisma.organization.create({
      data: {
        id: `test-org-b-${Date.now()}`,
        name: "Test Organization B",
        slug: `test-org-b-${Date.now()}`,
      },
    });

    const clientA = await prisma.client.create({
      data: {
        name: "Test Client A",
        organizationId: organizationA.id,
      },
    });

    projectA = await prisma.project.create({
      data: {
        name: "Private Project A",
        value: 5000,
        organizationId: organizationA.id,
        clientId: clientA.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: {
        id: projectA.id,
      },
    });

    await prisma.client.deleteMany({
      where: {
        organizationId: organizationA.id,
      },
    });

    await prisma.organization.deleteMany({
      where: {
        id: {
          in: [organizationA.id, organizationB.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  it("allows the owning organization to find its project", async () => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectA.id,
        organizationId: organizationA.id,
      },
    });

    expect(project?.id).toBe(projectA.id);
  });

  it("prevents another organization from finding the project", async () => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectA.id,
        organizationId: organizationB.id,
      },
    });

    expect(project).toBeNull();
  });
});