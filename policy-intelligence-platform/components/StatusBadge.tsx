import type { RecommendationStatus } from "@/types/governance";
import {
  Clock,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: RecommendationStatus;
  size?: "sm" | "md";
}

const config: Record<
  RecommendationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  "PENDING REVIEW": {
    label: "Pending Review",
    icon: Clock,
    className: "bg-amber-50 text-amber-800 border border-amber-300",
  },
  "UNDER REVIEW": {
    label: "Under Review",
    icon: Eye,
    className: "bg-blue-50 text-blue-800 border border-blue-300",
  },
  "CHANGES REQUESTED": {
    label: "Changes Requested",
    icon: RefreshCw,
    className: "bg-orange-50 text-orange-800 border border-orange-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-800 border border-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-50 text-red-800 border border-red-300",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, icon: Icon, className } = config[status];
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${className} ${textSize}`}
      aria-label={`Status: ${label}`}
    >
      <Icon className={iconSize} aria-hidden="true" />
      {label}
    </span>
  );
}
