import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check the actual Better Auth session on the server.
  // This protects every route inside the dashboard route group.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Users without a valid session cannot access the application workspace.
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}