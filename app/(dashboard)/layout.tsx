import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPendingInvitation } from "@/lib/organization-access";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const activeOrganizationId =
    session.session.activeOrganizationId;

  if (!activeOrganizationId) {
    const invitation =
      await getPendingInvitation(
        session.user.email,
      );

    if (invitation) {
      redirect(
        `/invitation/${invitation.id}`,
      );
    }

    redirect("/onboarding");
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="flex h-full min-h-0">
        <Sidebar />

        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          <Topbar />

          {/* Only the workspace content scrolls; the global topbar remains fixed. */}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}