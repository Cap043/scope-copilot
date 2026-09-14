import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";

// The authenticated session determines which organization owns the data.
// The browser never gets to choose an organization ID.

export async function getProjects() {
  const organizationId = await getCurrentOrganizationId();

  return prisma.project.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
    },
  });
}

export async function getProject(id: string) {
  const organizationId = await getCurrentOrganizationId();

  // The organization condition prevents a user from accessing
  // another organization's project even if they know its ID.
  return prisma.project.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      client: true,
    },
  });
}

export async function createProject(data: {
  name: string;
  client: string;
  value: number;
  startDate?: string;
  endDate?: string;
}) {
  const organizationId = await getCurrentOrganizationId();

  // Clients belong to the authenticated organization.
  const client = await prisma.client.create({
    data: {
      name: data.client,
      organizationId,
    },
  });

  // Create the project inside the authenticated organization.
  return prisma.project.create({
    data: {
      name: data.name,
      value: data.value,
      startDate: data.startDate
        ? new Date(data.startDate)
        : undefined,
      targetEndDate: data.endDate
        ? new Date(data.endDate)
        : undefined,
      organizationId,
      clientId: client.id,
    },
    include: {
      client: true,
    },
  });
}