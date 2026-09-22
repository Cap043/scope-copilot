import type { useScopeReview } from "../use-scope-review";
import type { ScopeReviewProps } from "../scope-types";
import type { NormalizedScope } from "@/lib/scope-schema";

export type ScopeReviewViewProps = ScopeReviewProps & {
  // UI-only metadata used by the scope workspace.
  scopeVersion?: number;
  sourceText?: string;
};

export type SectionKey =
  | "overview"
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities"
  | "revisionLimits"
  | "timeline"
  | "assumptions";

export type StandardSection =
  | "deliverables"
  | "features"
  | "exclusions"
  | "clientResponsibilities";

export type ScopeItem =
  NormalizedScope[StandardSection][number];

export type RevisionLimit =
  NormalizedScope["revisionLimits"][number];

export type Assumption =
  NormalizedScope["assumptions"][number];

export type Timeline =
  NormalizedScope["timeline"];

export type ScopeReviewController =
  ReturnType<typeof useScopeReview>;

export type ReviewScope =
  ScopeReviewController["reviewScope"];
