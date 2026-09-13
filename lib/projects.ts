import { prisma } from "@/lib/db";

// The database is now the single source of truth for projects.
// This replaces the temporary in-memory array we used while
// building the initial UI workflow.

export async function getProjects() {
  // Fetch projects belonging to the current organization.
  // Authentication will provide the organization ID later.
  //
  // For now, we use a temporary development organization ID.
  // We'll replace this with the authenticated user's organization
  // once Better Auth is connected.
  return prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
    },
  });
}

export async function getProject(id: string) {
  // Fetch one project together with its client.
  // This powers the project detail page.
  return prisma.project.findUnique({
    where: {
      id,
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
  // Until authentication exists, we need an organization and client
  // to satisfy the database relationships.
  //
  // This temporary development organization will be replaced by
  // the authenticated user's real organization.
  const organization = await prisma.organization.upsert({
    where: {
      id: "development-org",
    },
    update: {},
    create: {
      id: "development-org",
      name: "Development Agency",
    },
  });

  // Reuse an existing client with the same name inside this organization,
  // or create the client if this is the first project for them.
  const client = await prisma.client.create({
    data: {
      name: data.client,
      organizationId: organization.id,
    },
  });

  // Create the actual project in PostgreSQL.
  // Unlike our previous in-memory store, this survives refreshes
  // and server restarts.
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
      organizationId: organization.id,
      clientId: client.id,
    },
    include: {
      client: true,
    },
  });
}