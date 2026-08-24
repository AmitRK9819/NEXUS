interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function ConfidenceBar({
  score,
  showLabel = true,
  size = "md",
  className = "",
}: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  let colorClass = "bg-emerald-600";
  let textColor = "text-emerald-700";
  if (clamped < 60) {
    colorClass = "bg-amber-500";
    textColor = "text-amber-700";
  } else if (clamped < 80) {
    colorClass = "bg-blue-600";
    textColor = "text-blue-700";
  }

  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 overflow-hidden rounded-full bg-slate-200 ${heightClass}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI Confidence: ${clamped}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
