import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPendingInvitation } from "@/lib/organization-access";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  const invitation = await getPendingInvitation(
    session.user.email,
  );

  if (invitation) {
    redirect(`/invitation/${invitation.id}`);
  }

  return <OnboardingForm />;
}