"use server";

import { createProject } from "@/lib/projects";

// Server Actions run on the server, so database code never
// gets exposed to the browser. The form can safely call this
// function to create a project.
export async function createProjectAction(data: {
  name: string;
  client: string;
  value: number;
  startDate?: string;
  endDate?: string;
}) {
  // Forward the validated project data to our database layer.
  // Authentication/organization ownership will be added here later.
  const project = await createProject(data);

  // Return only what the client needs after creation.
  return {
    id: project.id,
  };
}