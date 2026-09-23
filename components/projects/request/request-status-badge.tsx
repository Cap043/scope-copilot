import { Badge } from "@/components/ui/badge";

export type RequestStatus =
  | "NEW"
  | "ANALYZED"
  | "REVIEW"
  | "RESOLVED";

const statusConfig: Record<
  RequestStatus,
  {
    label: string;
    variant:
      | "outline"
      | "secondary"
      | "warning"
      | "success"
      | "ai";
  }
> = {
  NEW: {
    label: "New",
    variant: "outline",
  },
  ANALYZED: {
    label: "Analyzed",
    variant: "ai",
  },
  REVIEW: {
    label: "Needs review",
    variant: "warning",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "success",
  },
};

export function RequestStatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
