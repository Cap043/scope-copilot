"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvitationCardProps = {
  invitationId: string;
  organizationName: string;
  role: string;
};

export function InvitationCard({
  invitationId,
  organizationName,
  role,
}: InvitationCardProps) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setError("");
    setLoading(true);

    const { error } =
      await authClient.organization.acceptInvitation({
        invitationId,
      });

    setLoading(false);

    if (error) {
      setError(
        error.message ||
          "We couldn't accept this invitation.",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You have been invited</CardTitle>

          <p className="text-sm text-muted-foreground">
            You have been invited to join{" "}
            <span className="font-medium text-foreground">
              {organizationName}
            </span>
            .
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm">
              Your role:{" "}
              <span className="font-medium capitalize">
                {role}
              </span>
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Joining workspace..." : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}