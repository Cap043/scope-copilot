import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";

export async function createScopeBaseline(data: {
  projectId: string;
  sourceText: string;
}) {
  const organizationId = await getCurrentOrganizationId();

  const sourceText = data.sourceText.trim();

  if (!sourceText) {
    throw new Error("Scope text cannot be empty.");
  }

  // The project must belong to the authenticated organization.
  // The browser never gets to choose the organization boundary.
  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  // New scope versions build on the latest existing version.
  const latestBaseline = await prisma.scopeBaseline.findFirst({
    where: {
      projectId: project.id,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      version: true,
    },
  });

  const version = (latestBaseline?.version ?? 0) + 1;

  return prisma.scopeBaseline.create({
    data: {
      projectId: project.id,
      version,
      status: "DRAFT",
      sourceType: "PASTE",
      sourceText,

      // AI extraction will populate this later.
      // For now the baseline contains an intentionally empty structure.
    structuredScope: {
  deliverables: [],
  features: [],
  exclusions: [],
  clientResponsibilities: [],
  revisionLimits: [],
  timeline: {},
  assumptions: [],
},
    },
  });
}