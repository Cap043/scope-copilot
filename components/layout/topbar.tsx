"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();

  async function handleSignOut() {
    // End the Better Auth session, then return to the login page.
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Workspace
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>

        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          SP
        </div>
      </div>
    </header>
  );
}