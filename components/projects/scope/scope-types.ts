import type { NormalizedScope } from "@/lib/scope-schema";

export type ScopeReviewProps = {
  projectId: string;
  baselineId: string;
  status: string;
  scope: NormalizedScope;
};

export type ScopeArraySection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities"
  | "revisionLimits"
  | "assumptions";

export type StandardScopeSection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities";

export type SourceReference = {
  quote: string;
  section?: string;
};

export type ScopeItem =
  | NormalizedScope["deliverables"][number]
  | NormalizedScope["features"][number]
  | NormalizedScope["exclusions"][number]
  | NormalizedScope["clientResponsibilities"][number];

export type RevisionLimit =
  NormalizedScope["revisionLimits"][number];

export type Timeline = NormalizedScope["timeline"];

export type Assumption =
  NormalizedScope["assumptions"][number];

export type AmendmentMeta = {
  rationale: string;
  referenceId: string;
};
