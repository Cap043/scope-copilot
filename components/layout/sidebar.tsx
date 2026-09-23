"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  FileText,
  FolderKanban,
  ListChecks,
  Settings,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "cn";

const workspaceNavigation = [
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

const scopeSections = [
  {
    name: "Overview",
    hash: "overview",
    icon: Sparkles,
  },
  {
    name: "Deliverables",
    hash: "deliverables",
    icon: FileText,
  },
  {
    name: "Features",
    hash: "features",
    icon: ListChecks,
  },
  {
    name: "Exclusions",
    hash: "exclusions",
    icon: XCircle,
  },
  {
    name: "Client Responsibilities",
    hash: "clientResponsibilities",
    icon: Users,
  },
  {
    name: "Revision Limits",
    hash: "revisionLimits",
    icon: ClipboardList,
  },
  {
    name: "Timeline",
    hash: "timeline",
    icon: CalendarDays,
  },
  {
    name: "Assumptions",
    hash: "assumptions",
    icon: CheckCircle2,
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

type ScopeSection =
  | "overview"
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities"
  | "revisionLimits"
  | "timeline"
  | "assumptions";

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

function getProjectId(pathname: string) {
  const match = pathname.match(
    /^\/projects\/([^/]+)/,
  );

  return match?.[1] ?? null;
}

function isScopeRoute(pathname: string) {
  // Scope navigation belongs only to the actual Scope workspace.
  // It must disappear on /scope/update and historical version routes.
  return /^\/projects\/[^/]+\/scope$/.test(
    pathname,
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const projectId = getProjectId(pathname);
  const scopeRoute = isScopeRoute(pathname);

  const [
    activeScopeSection,
    setActiveScopeSection,
  ] = useState<ScopeSection>("overview");

  useEffect(() => {
    if (!scopeRoute) {
      setActiveScopeSection("overview");
      return;
    }

    function syncHash() {
      const hash =
        window.location.hash.replace(
          "#",
          "",
        ) as ScopeSection;

      const valid =
        scopeSections.some(
          (section) =>
            section.hash === hash,
        );

      setActiveScopeSection(
        valid ? hash : "overview",
      );
    }

    syncHash();

    window.addEventListener(
      "hashchange",
      syncHash,
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        syncHash,
      );
    };
  }, [scopeRoute]);

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-150 group-hover:scale-[1.02]">
            <Sparkles className="size-4" />
          </div>

          <p className="truncate text-sm font-semibold tracking-[-0.01em] text-sidebar-foreground">
            Scope Copilot
          </p>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Global navigation is always available. */}
        <div className="px-3 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Workspace
          </p>

          <nav className="space-y-1">
            {workspaceNavigation.map(
              (item) => {
                const Icon = item.icon;

                const active =
                  isActivePath(
                    pathname,
                    item.href,
                    item.exact,
                  );

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={
                      active
                        ? "page"
                        : undefined
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

                    <span>
                      {item.name}
                    </span>
                  </Link>
                );
              },
            )}
          </nav>
        </div>

        {scopeRoute && projectId && (
          <>
            <div className="mx-3 my-5 h-px bg-sidebar-border" />

            <div className="px-3">
              <Link
                href={`/projects/${projectId}`}
                className="mb-4 flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-sidebar-foreground"
              >
                <ChevronLeft className="size-3.5" />
                Current project
              </Link>

              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                Scope
              </p>

              <nav
                aria-label="Scope sections"
                className="space-y-0.5"
              >
                {scopeSections.map(
                  (item) => {
                    const Icon = item.icon;

                    const active =
                      activeScopeSection ===
                      item.hash;

                    return (
                      <a
                        key={item.hash}
                        href={`/projects/${projectId}/scope#${item.hash}`}
                        aria-current={
                          active
                            ? "location"
                            : undefined
                        }
                        className={cn(
                          "group flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5 shrink-0",
                            active
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />

                        <span className="truncate">
                          {item.name}
                        </span>
                      </a>
                    );
                  },
                )}
              </nav>
            </div>
          </>
        )}

        {!scopeRoute && (
          <div className="px-3 pb-5">
            <div className="mx-3 my-5 h-px bg-sidebar-border" />

            <nav className="space-y-1">
              {secondaryNavigation.map(
                (item) => {
                  const Icon = item.icon;

                  const active =
                    isActivePath(
                      pathname,
                      item.href,
                      item.exact,
                    );

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={
                        active
                          ? "page"
                          : undefined
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

                      <span>
                        {item.name}
                      </span>
                    </Link>
                  );
                },
              )}
            </nav>
          </div>
        )}
      </div>

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