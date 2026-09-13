import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, FolderKanban, Inbox, Receipt, TriangleAlert } from "lucide-react";

const stats = [
  {
    label: "Active Projects",
    value: "0",
    description: "Projects currently in progress",
    icon: FolderKanban,
  },
  {
    label: "Pending Requests",
    value: "0",
    description: "Client requests waiting for a decision",
    icon: Inbox,
  },
  {
    label: "Unpriced Work",
    value: "$0",
    description: "Potential work not yet priced",
    icon: Receipt,
  },
  {
    label: "Scope Alerts",
    value: "0",
    description: "Projects showing scope drift",
    icon: TriangleAlert,
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good morning
          </h1>

          <p className="mt-2 text-muted-foreground">
            Here&apos;s what&apos;s happening across your projects.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>

                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>

                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Projects */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FolderKanban className="size-5 text-muted-foreground" />
              </div>

              <h2 className="mt-4 font-medium">
                No projects yet
              </h2>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first project and upload its scope so Scope
                Copilot can start analyzing client requests.
              </p>

              <a
                href="/projects"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Create your first project
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}