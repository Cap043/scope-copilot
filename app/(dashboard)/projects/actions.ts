"use server";

import { createProject } from "@/lib/projects";

export async function createProjectAction(data: {
  name: string;
  client: string;
  value: number;
  startDate?: string;
  endDate?: string;
}) {
  // createProject derives the organization from the authenticated
  // session, so the browser cannot choose where the project is stored.
  const project = await createProject(data);

  // Return only what the client needs after creation.
  return {
    id: project.id,
  };
}