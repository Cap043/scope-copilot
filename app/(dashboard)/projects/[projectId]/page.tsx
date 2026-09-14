import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProject } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { ScopeInput } from "@/components/projects/scope/scope-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  // Next.js 16 provides dynamic route params asynchronously.
  const { projectId } = await params;

  // Fetch the project from PostgreSQL through our database layer.
  const project = await getProject(projectId);

  // Show a simple fallback when the requested project does not exist.
  if (!project) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold">
            Project not found
          </h1>

          <Button
            className="mt-4"
            variant="outline"
            nativeButton={false}
            render={<Link href="/projects" />}
          >
            <ArrowLeft />
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">
            Project
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {project.client.name}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Project value
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold">
                ${Number(project.value).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Start date
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold">
                {project.startDate
                  ? project.startDate.toLocaleDateString()
                  : "Not set"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Target end
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold">
                {project.targetEndDate
                  ? project.targetEndDate.toLocaleDateString()
                  : "Not set"}
              </p>
            </CardContent>
          </Card>
        </div>

        {project.scopeBaselines.length === 0 ? (
  <ScopeInput projectId={project.id} />
) : (
  <Card className="mt-8">
    <CardHeader>
      <CardTitle>Scope</CardTitle>
    </CardHeader>

    <CardContent>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Scope baseline v{project.scopeBaselines[0].version}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Draft
            </p>
          </div>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            DRAFT
          </span>
        </div>

        <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
          {project.scopeBaselines[0].sourceText}
        </p>
      </div>
    </CardContent>
  </Card>
)}
      </div>
    </div>
  );
}