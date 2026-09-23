import { prisma } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/auth-session";

export type ClientRequestStatus =
  | "NEW"
  | "ANALYZED"
  | "REVIEW"
  | "RESOLVED";

/**
 * Create a client request and pin it to the latest approved scope.
 *
 * The organization, project, baseline lookup, and request creation happen
 * inside one transaction so the historical baseline choice is atomic.
 */
export async function createClientRequest(data: {
  projectId: string;
  originalText: string;
}) {
  const organizationId = await getCurrentOrganizationId();

  const projectId = data.projectId.trim();
  const originalText = data.originalText;

  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  if (!originalText.trim()) {
    throw new Error("Client request cannot be empty.");
  }

  return prisma.$transaction(async (tx) => {
    // Resolve the project through the authenticated organization first.
    // The browser cannot choose an organization.
    const project = await tx.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    // The request must always be evaluated against an approved scope.
    // Never use "latest baseline" without checking approval status.
    const baseline = await tx.scopeBaseline.findFirst({
      where: {
        projectId: project.id,
        status: "APPROVED",
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

    if (!baseline) {
      throw new Error(
        "An approved scope baseline is required before capturing a client request.",
      );
    }

    // Preserve the original request wording. We only use trim() for validation.
    const request = await tx.clientRequest.create({
      data: {
        projectId: project.id,
        analyzedAgainstBaselineId: baseline.id,
        originalText,
        status: "NEW",
      },
      select: {
        id: true,
        projectId: true,
        analyzedAgainstBaselineId: true,
        originalText: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...request,
      baselineVersion: baseline.version,
    };
  });
}

/**
 * Load all client requests for a project.
 *
 * Organization ownership is checked server-side through the project relation.
 */
export async function getClientRequests(projectId: string) {
  const organizationId = await getCurrentOrganizationId();

  const safeProjectId = projectId.trim();

  if (!safeProjectId) {
    throw new Error("Project ID is required.");
  }

  return prisma.clientRequest.findMany({
    where: {
      projectId: safeProjectId,
      project: {
        organizationId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      projectId: true,
      originalText: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      analyzedAgainstBaseline: {
        select: {
          id: true,
          version: true,
          status: true,
        },
      },
    },
  });
}

/**
 * Load one request only when both the project and request belong to the
 * authenticated organization.
 *
 * The project and pinned baseline are returned with the request so the
 * historical relationship can be displayed directly.
 */
export async function getClientRequest(
  projectId: string,
  requestId: string,
) {
  const organizationId = await getCurrentOrganizationId();

  const safeProjectId = projectId.trim();
  const safeRequestId = requestId.trim();

  if (!safeProjectId || !safeRequestId) {
    throw new Error("Project ID and request ID are required.");
  }

  return prisma.clientRequest.findFirst({
    where: {
      id: safeRequestId,
      projectId: safeProjectId,
      project: {
        organizationId,
      },
    },
    select: {
      id: true,
      projectId: true,
      originalText: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      analyzedAgainstBaseline: {
        select: {
          id: true,
          version: true,
          status: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          value: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}