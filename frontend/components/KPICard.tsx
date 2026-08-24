import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  highlight?: "amber" | "emerald" | "blue" | "default";
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = "default",
}: KPICardProps) {
  const borderHighlight =
    highlight === "amber"
      ? "border-amber-300 bg-amber-50/40"
      : highlight === "emerald"
        ? "border-emerald-300 bg-emerald-50/40"
        : highlight === "blue"
          ? "border-blue-300 bg-blue-50/40"
          : "border-slate-200 bg-white";

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${borderHighlight}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={`font-semibold ${
              trend.positive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
