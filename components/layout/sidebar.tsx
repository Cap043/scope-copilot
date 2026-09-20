"use client";

import Link from "next/link";
import {
  BarChart3,
  FolderKanban,
  Settings,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    exact: true,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
    exact: false,
  },
] as const;

const secondaryNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    exact: true,
  },
] as const;

function isActivePath(
  pathname: string,
  href: string,
  exact: boolean,
) {
  if (exact) {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:min-h-screen md:flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-150 group-hover:scale-[1.02]">
            <Sparkles className="size-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-sidebar-foreground">
              Scope Copilot
            </p>
          </div>
        </Link>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(
              pathname,
              item.href,
              item.exact,
            );

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={cn(
                  "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-6">
          <div className="h-px bg-sidebar-border" />
        </div>

        {/* Secondary navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(
              pathname,
              item.href,
              item.exact,
            );

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={cn(
                  "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Product reminder */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">
            Scope Copilot
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Know what it will cost before you say yes.
          </p>
        </div>
      </div>
    </aside>
  );
}