"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const mobileNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const;

function getPageContext(pathname: string) {
  if (pathname === "/dashboard") {
    return {
      label: "Dashboard",
      description: "Overview of your workspace",
    };
  }

  if (pathname === "/projects") {
    return {
      label: "Projects",
      description: "Manage projects and scope",
    };
  }

  if (pathname.endsWith("/requests/new")) {
    return {
      label: "New client request",
      description: "Capture a request for scope analysis",
    };
  }

  if (pathname.includes("/requests")) {
    return {
      label: "Client requests",
      description: "Review requests against project scope",
    };
  }

  if (pathname.includes("/scope")) {
    return {
      label: "Scope",
      description: "Review the project's agreed scope",
    };
  }

  if (pathname.includes("/history")) {
    return {
      label: "Scope history",
      description: "Inspect previous scope versions",
    };
  }

  if (pathname.startsWith("/projects/")) {
    return {
      label: "Project workspace",
      description: "Project overview and decisions",
    };
  }

  return {
    label: "Workspace",
    description: "Scope Copilot",
  };
}

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: session } = authClient.useSession();

  const user = session?.user;
  const context = getPageContext(pathname);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  // Generate initials from the authenticated user's name.
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen((open) => !open)
            }
          >
            {mobileOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </Button>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {context.label}
          </p>

          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {context.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
        </Button>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden min-w-0 text-right lg:block">
              <p className="truncate text-sm font-medium leading-none">
                {user.name}
              </p>

              <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>

            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground"
              title={user.name}
            >
              {initials}
            </div>

            <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-16 border-b bg-card px-4 py-3 shadow-lg md:hidden">
          <nav className="space-y-1">
            {mobileNavigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`,
                );

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      active
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />

                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}