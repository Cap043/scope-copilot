interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { projectId } = await params;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Project
        </h1>

        <p className="mt-2 text-muted-foreground">
          Project ID: {projectId}
        </p>
      </div>
    </div>
  );
}