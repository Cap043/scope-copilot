import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ScopeVersionHistoryItem } from "@/lib/scope-versions";

type ScopeVersionHistoryProps = {
  projectId: string;
  versions: ScopeVersionHistoryItem[];
  currentVersion?: number;
};

function statusLabel(
  version: ScopeVersionHistoryItem,
) {
  if (version.isLatest && version.status === "DRAFT") {
    return "Latest draft";
  }

  if (version.isCurrentApproved) {
    return "Current approved";
  }

  if (version.status === "APPROVED") {
    return "Historical approved";
  }

  return version.status;
}

function statusClasses(
  version: ScopeVersionHistoryItem,
) {
  if (version.isLatest && version.status === "DRAFT") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  if (version.isCurrentApproved) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  return "bg-muted text-muted-foreground";
}

function sourceTypeLabel(
  sourceType: string,
) {
  return sourceType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function candidateStatusLabel(
  status: string | null,
) {
  if (!status) {
    return null;
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function ScopeVersionHistory({
  projectId,
  versions,
  currentVersion,
}: ScopeVersionHistoryProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              Scope versions
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Every scope snapshot remains available for
              inspection.
            </p>
          </div>

          <div className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {versions.length}{" "}
            {versions.length === 1
              ? "version"
              : "versions"}
          </div>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm text-muted-foreground">
            No scope versions exist yet.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {versions.map((version) => {
            const selected =
              currentVersion ===
              version.version;

            const candidateStatus =
              candidateStatusLabel(
                version.revisionCandidateStatus,
              );

            return (
              <Link
                key={version.id}
                href={`/projects/${projectId}/scope/versions/${version.version}`}
                className={`block px-5 py-4 transition-colors hover:bg-muted/40 ${
                  selected
                    ? "bg-muted/30"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        v{version.version}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                          version,
                        )}`}
                      >
                        {statusLabel(version)}
                      </span>

                      {selected && (
                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                          Viewing
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        Created{" "}
                        {version.createdAt.toLocaleDateString()}
                      </span>

                      {version.approvedAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5" />
                          Approved{" "}
                          {version.approvedAt.toLocaleDateString()}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        {sourceTypeLabel(
                          version.sourceType,
                        )}
                      </span>
                    </div>

                    {candidateStatus && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Revision candidate:{" "}
                        <span className="font-medium text-foreground">
                          {candidateStatus}
                        </span>
                      </p>
                    )}
                  </div>

                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}