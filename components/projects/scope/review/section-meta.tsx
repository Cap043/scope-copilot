import type { ReactNode } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Layers3,
  ListChecks,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import type {
  SectionKey,
  StandardSection,
} from "./types";

export const STANDARD_SECTIONS: StandardSection[] = [
  "deliverables",
  "features",
  "exclusions",
  "clientResponsibilities",
];

export const SECTION_META: Record<
  SectionKey,
  {
    label: string;
    description: string;
    icon: ReactNode;
  }
> = {
  overview: {
    label: "Overview",
    description:
      "A concise view of the current scope baseline.",
    icon: <Sparkles className="size-4" />,
  },

  deliverables: {
    label: "Deliverables",
    description:
      "Main outputs included in the project.",
    icon: <Layers3 className="size-4" />,
  },

  features: {
    label: "Features",
    description:
      "Specific functionality included in the scope.",
    icon: <ListChecks className="size-4" />,
  },

  exclusions: {
    label: "Exclusions",
    description:
      "Explicit boundaries on what is not included.",
    icon: <XCircle className="size-4" />,
  },

  clientResponsibilities: {
    label: "Client Responsibilities",
    description:
      "Inputs and actions owned by the client.",
    icon: <Users className="size-4" />,
  },

  revisionLimits: {
    label: "Revision Limits",
    description:
      "Defined limits around included revisions.",
    icon: <ClipboardList className="size-4" />,
  },

  timeline: {
    label: "Timeline",
    description:
      "Duration, start condition, and dependencies.",
    icon: <CalendarDays className="size-4" />,
  },

  assumptions: {
    label: "Assumptions",
    description:
      "Conditions that define the scope boundary.",
    icon: <CheckCircle2 className="size-4" />,
  },
};

export function isSectionKey(
  value: string,
): value is SectionKey {
  return value in SECTION_META;
}

export function isStandardSection(
  section: SectionKey,
): section is StandardSection {
  return STANDARD_SECTIONS.includes(
    section as StandardSection,
  );
}
