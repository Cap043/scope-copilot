import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getPendingInvitation(email: string) {
  return prisma.invitation.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}