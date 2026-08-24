import type { RecommendationPriority } from "@/types/governance";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";

interface PriorityBadgeProps {
  priority: RecommendationPriority;
}

const config: Record<
  RecommendationPriority,
  { label: string; icon: React.ElementType; className: string }
> = {
  CRITICAL: {
    label: "Critical",
    icon: AlertTriangle,
    className: "bg-red-600 text-white",
  },
  HIGH: {
    label: "High",
    icon: ArrowUp,
    className: "bg-orange-500 text-white",
  },
  MEDIUM: {
    label: "Medium",
    icon: Minus,
    className: "bg-amber-400 text-amber-900",
  },
  LOW: {
    label: "Low",
    icon: ArrowDown,
    className: "bg-slate-200 text-slate-700",
  },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, icon: Icon, className } = config[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${className}`}
      aria-label={`Priority: ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
