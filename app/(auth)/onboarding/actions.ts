"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function createWorkspaceAction(
  workspaceName: string,
) {
  const name = workspaceName.trim();

  if (!name) {
    return {
      error: "Please enter your agency name.",
    };
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = `${slugBase || "workspace"}-${Date.now()}`;

  try {
    const organization = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
      },
    });

    return {
      organization,
    };
  } catch (error) {
    console.error("Failed to create workspace:", error);

    return {
      error: "We couldn't create your workspace. Please try again.",
    };
  }
}