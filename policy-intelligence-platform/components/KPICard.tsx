import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  highlight?: "neutral" | "positive" | "warning" | "critical";
}

const highlightStyles: Record<string, string> = {
  neutral: "border-slate-200 bg-white",
  positive: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  critical: "border-red-200 bg-red-50",
};

const iconStyles: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-600",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function KPICard({
  label,
  value,
  icon: Icon,
  description,
  highlight = "neutral",
}: KPICardProps) {
  return (
    <article
      className={`rounded-lg border p-4 ${highlightStyles[highlight]}`}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${iconStyles[highlight]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
