import type { RecommendationPriority } from "@/types/governance";

interface PriorityBadgeProps {
  priority: RecommendationPriority;
  className?: string;
}

const priorityConfig: Record<
  RecommendationPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-100",
    text: "text-red-900",
    border: "border-red-300",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-300",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    border: "border-yellow-300",
  },
  LOW: {
    label: "Low",
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
  },
};

export default function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? priorityConfig.LOW;

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${config.border} ${className}`}
      aria-label={`Priority: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
