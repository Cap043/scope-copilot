import { ProjectForm } from "@/components/projects/project-form";
import { ProjectCard } from "@/components/projects/project-card";
import { getProjects } from "@/lib/projects";

export default async function ProjectsPage() {
  // Fetch projects directly on the server.
  // This keeps database access out of the browser.
  const projects = await getProjects();

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Projects
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage your projects and their scope.
            </p>
          </div>

          <ProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <h2 className="text-lg font-medium">
              No projects yet
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create your first project to establish its scope and start
              analyzing client requests.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}