import type { ScopeRelationship } from "@/lib/ai/request/compare-scope";

const RELATIONSHIP_LABELS: Record<
  ScopeRelationship,
  string
> = {
  DIRECTLY_INCLUDED:
    "Directly included",

  PARTIALLY_INCLUDED:
    "Partially included",

  RELATED_NOT_INCLUDED:
    "Related, not included",

  EXPLICITLY_EXCLUDED:
    "Explicitly excluded",

  CONFLICTING:
    "Conflicting",

  AMBIGUOUS:
    "Ambiguous",

  UNRELATED:
    "Unrelated",

  NO_SCOPE_EVIDENCE:
    "Not found in approved scope",
};

const RELATIONSHIP_CLASSES: Record<
  ScopeRelationship,
  string
> = {
  DIRECTLY_INCLUDED:
    "bg-success/10 text-success",

  PARTIALLY_INCLUDED:
    "bg-warning/10 text-warning",

  RELATED_NOT_INCLUDED:
    "bg-muted text-muted-foreground",

  EXPLICITLY_EXCLUDED:
    "bg-destructive/10 text-destructive",

  CONFLICTING:
    "bg-destructive/10 text-destructive",

  AMBIGUOUS:
    "bg-warning/10 text-warning",

  UNRELATED:
    "bg-muted text-muted-foreground",

  NO_SCOPE_EVIDENCE:
    "bg-muted text-muted-foreground",
};

export function ScopeRelationshipBadge({
  relationship,
  compact = false,
}: {
  relationship: ScopeRelationship;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex max-w-full items-center rounded-full font-medium leading-4",
        compact
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs",
        RELATIONSHIP_CLASSES[
          relationship
        ],
      ].join(" ")}
    >
      {RELATIONSHIP_LABELS[
        relationship
      ]}
    </span>
  );
}