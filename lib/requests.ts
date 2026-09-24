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
/**
 * Load all client requests for a project.
 *
 * Organization ownership is checked server-side through the project relation.
 *
 * Only the atomic-item count is loaded here because the requests list
 * does not need the full item records.
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

      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}
/**
 * Load one request only when both the project and request belong to the
 * authenticated organization.
 */
export async function getClientRequest(
  projectId: string,
  requestId: string,
) {
  const organizationId = await getCurrentOrganizationId();

  const safeProjectId = projectId.trim();
  const safeRequestId = requestId.trim();

  if (!safeProjectId || !safeRequestId) {
    throw new Error(
      "Project ID and request ID are required.",
    );
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

      items: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          clientRequestId: true,
          position: true,
          text: true,
          createdAt: true,
          updatedAt: true,
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

/**
 * Create one atomic ask inside an existing case file.
 */
export async function createClientRequestItem(data: {
  clientRequestId: string;
  position: number;
  text: string;
}) {
  const organizationId = await getCurrentOrganizationId();

  const clientRequestId = data.clientRequestId.trim();
  const text = data.text;

  if (!clientRequestId) {
    throw new Error("Client request ID is required.");
  }

  if (
    !Number.isInteger(data.position) ||
    data.position < 1
  ) {
    throw new Error(
      "Client request item position must be a positive integer.",
    );
  }

  if (!text.trim()) {
    throw new Error(
      "Client request item cannot be empty.",
    );
  }

  const request = await prisma.clientRequest.findFirst({
    where: {
      id: clientRequestId,
      project: {
        organizationId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    throw new Error("Client request not found.");
  }

  return prisma.clientRequestItem.create({
    data: {
      clientRequestId: request.id,
      position: data.position,
      text,
    },
    select: {
      id: true,
      clientRequestId: true,
      position: true,
      text: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Load atomic asks for a case file.
 */
export async function getClientRequestItems(
  clientRequestId: string,
) {
  const organizationId = await getCurrentOrganizationId();

  const safeClientRequestId =
    clientRequestId.trim();

  if (!safeClientRequestId) {
    throw new Error(
      "Client request ID is required.",
    );
  }

  return prisma.clientRequestItem.findMany({
    where: {
      clientRequestId: safeClientRequestId,
      clientRequest: {
        project: {
          organizationId,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
    select: {
      id: true,
      clientRequestId: true,
      position: true,
      text: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Persist the reviewed AI decomposition.
 *
 * Items can only be created when the case file currently has no items.
 * This prevents silently replacing already-established analysis inputs.
 */
export async function saveClientRequestItems(data: {
  clientRequestId: string;
  items: string[];
}) {
  const organizationId =
    await getCurrentOrganizationId();

  const clientRequestId =
    data.clientRequestId.trim();

  if (!clientRequestId) {
    throw new Error(
      "Client request ID is required.",
    );
  }

  if (
    !Array.isArray(data.items) ||
    data.items.length < 1 ||
    data.items.length > 20
  ) {
    throw new Error(
      "A request must contain between 1 and 20 atomic items.",
    );
  }

  const normalizedItems = data.items.map(
    (item) => {
      if (typeof item !== "string") {
        throw new Error(
          "Atomic request items must be text.",
        );
      }

      const text = item.trim();

      if (!text) {
        throw new Error(
          "Atomic request items cannot be empty.",
        );
      }

      if (text.length > 1000) {
        throw new Error(
          "Atomic request items cannot exceed 1000 characters.",
        );
      }

      return text;
    },
  );

  const uniqueItems = new Set(
    normalizedItems.map((item) =>
      item.toLowerCase(),
    ),
  );

  if (
    uniqueItems.size !==
    normalizedItems.length
  ) {
    throw new Error(
      "Atomic request items must be unique.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const request =
      await tx.clientRequest.findFirst({
        where: {
          id: clientRequestId,
          project: {
            organizationId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!request) {
      throw new Error(
        "Client request not found.",
      );
    }

    const existingCount =
      await tx.clientRequestItem.count({
        where: {
          clientRequestId: request.id,
        },
      });

    if (existingCount > 0) {
      throw new Error(
        "Atomic request items already exist for this case file.",
      );
    }

    await tx.clientRequestItem.createMany({
      data: normalizedItems.map(
        (text, index) => ({
          clientRequestId: request.id,
          position: index + 1,
          text,
        }),
      ),
    });

    return tx.clientRequestItem.findMany({
      where: {
        clientRequestId: request.id,
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
        clientRequestId: true,
        position: true,
        text: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
}