"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();

  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const user = session?.user;

  // Generate initials from the authenticated user's name.
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">
                {user.name}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>

            <div
              className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
              title={user.name}
            >
              {initials}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}