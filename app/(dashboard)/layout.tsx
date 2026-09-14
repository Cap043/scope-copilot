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
    const invitation = await getPendingInvitation(
      session.user.email,
    );

    if (invitation) {
      redirect(`/invitation/${invitation.id}`);
    }

    redirect("/onboarding");
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