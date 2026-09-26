import type { ScopeRelationship } from "@/lib/ai/request/compare-scope";

const RELATIONSHIP_LABELS: Record<
  ScopeRelationship,
  string
> = {
  DIRECTLY_INCLUDED: "Directly included",
  PARTIALLY_INCLUDED: "Partially included",
  RELATED_NOT_INCLUDED: "Related, not included",
  EXPLICITLY_EXCLUDED: "Explicitly excluded",
  CONFLICTING: "Conflicting",
  AMBIGUOUS: "Ambiguous",
  UNRELATED: "Unrelated",
};

const RELATIONSHIP_CLASSES: Record<
  ScopeRelationship,
  string
> = {
  DIRECTLY_INCLUDED:
    "bg-success text-success-foreground",
  PARTIALLY_INCLUDED:
    "bg-warning text-warning-foreground",
  RELATED_NOT_INCLUDED:
    "bg-muted text-muted-foreground",
  EXPLICITLY_EXCLUDED:
    "bg-destructive text-destructive-foreground",
  CONFLICTING:
    "bg-destructive text-destructive-foreground",
  AMBIGUOUS:
    "bg-orange-500 text-white",
  UNRELATED:
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
        "inline-flex items-center rounded-full font-medium",
        compact
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs",
        RELATIONSHIP_CLASSES[relationship],
      ].join(" ")}
    >
      {RELATIONSHIP_LABELS[relationship]}
    </span>
  );
}