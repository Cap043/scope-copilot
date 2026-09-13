import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    value: unknown;
    targetEndDate: Date | null;
    client: {
      name: string;
    };
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{project.name}</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {project.client.name}
            </p>
          </div>

          <ArrowUpRight className="size-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Project value
              </p>

              <p className="mt-1 font-medium">
                ${Number(project.value).toLocaleString()}
              </p>
            </div>

            {project.targetEndDate && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Target end
                </p>

                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  <CalendarDays className="size-3.5" />
                  {project.targetEndDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}