"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

type ProjectWorkspaceNavProps = {
  projectId: string;
};

function getNavigation(projectId: string) {
  const basePath = `/projects/${projectId}`;

  return [
    {
      label: "Overview",
      href: basePath,
      exact: true,
    },
    {
      label: "Scope",
      href: `${basePath}/scope`,
      exact: false,
    },
    {
      label: "Requests",
      href: `${basePath}/requests`,
      exact: false,
    },
    {
      label: "History",
      href: `${basePath}/history`,
      exact: false,
    },
  ] as const;
}

export function ProjectWorkspaceNav({
  projectId,
}: ProjectWorkspaceNavProps) {
  const pathname = usePathname();
  const navigation = getNavigation(projectId);

  return (
    <nav
      aria-label="Project navigation"
      className="mt-5 overflow-x-auto border-b border-border"
    >
      <div className="flex min-w-max gap-1">
        {navigation.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`,
              );

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={
                active ? "page" : undefined
              }
              className={cn(
                "relative px-3 py-2.5 text-sm font-medium transition-colors",
                "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-opacity",
                active
                  ? "text-foreground after:opacity-100"
                  : "text-muted-foreground after:opacity-0 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}