import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPendingInvitation } from "@/lib/organization-access";
import { InvitationCard } from "@/components/auth/invitation-card";

type InvitationPageProps = {
  params: Promise<{
    invitationId: string;
  }>;
};

export default async function InvitationPage({
  params,
}: InvitationPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  const { invitationId } = await params;

  const invitation = await getPendingInvitation(
    session.user.email,
  );

  if (!invitation || invitation.id !== invitationId) {
    redirect("/onboarding");
  }

  return (
    <InvitationCard
      invitationId={invitation.id}
      organizationName={invitation.organization.name}
      role={invitation.role || "member"}
    />
  );
}