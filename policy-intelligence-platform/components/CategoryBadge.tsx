import type { RecommendationCategory } from "@/types/governance";
import {
  Stethoscope,
  Car,
  Droplets,
  Wifi,
  Zap,
  GraduationCap,
} from "lucide-react";

interface CategoryBadgeProps {
  category: RecommendationCategory;
}

const config: Record<
  RecommendationCategory,
  { icon: React.ElementType; className: string }
> = {
  Healthcare: {
    icon: Stethoscope,
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  Transport: {
    icon: Car,
    className: "bg-violet-50 text-violet-700 border border-violet-200",
  },
  "Water Supply": {
    icon: Droplets,
    className: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  },
  "Digital Infrastructure": {
    icon: Wifi,
    className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  Energy: {
    icon: Zap,
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
  Education: {
    icon: GraduationCap,
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const { icon: Icon, className } = config[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {category}
    </span>
  );
}
