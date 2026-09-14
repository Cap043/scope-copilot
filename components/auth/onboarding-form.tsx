"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createWorkspaceAction } from "@/app/(auth)/onboarding/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await createWorkspaceAction(
      workspaceName,
    );

    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>

          <p className="text-sm text-muted-foreground">
            What is the name of your agency?
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="workspaceName">
                Agency name
              </Label>

              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(event) =>
                  setWorkspaceName(event.target.value)
                }
                placeholder="e.g. Acme Agency"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Creating workspace..."
                : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}