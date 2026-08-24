import type { RecommendationCategory } from "@/types/governance";

interface CategoryBadgeProps {
  category: RecommendationCategory;
  className?: string;
}

const categoryConfig: Record<
  RecommendationCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  Healthcare: {
    label: "Healthcare",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  Transport: {
    label: "Transport",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  "Water Supply": {
    label: "Water Supply",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  "Digital Infrastructure": {
    label: "Digital Infrastructure",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  Energy: {
    label: "Energy",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  Education: {
    label: "Education",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

export default function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? {
    label: category,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}
