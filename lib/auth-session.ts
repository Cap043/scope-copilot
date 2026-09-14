import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { requireActiveOrganizationId } from "@/lib/organization";

export async function getCurrentOrganizationId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return requireActiveOrganizationId(
    session.session.activeOrganizationId,
  );
}