interface ConfidenceBarProps {
  value: number; // 0–100
  showLabel?: boolean;
}

function getColor(value: number): string {
  if (value >= 90) return "bg-emerald-500";
  if (value >= 75) return "bg-blue-500";
  if (value >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getLabel(value: number): string {
  if (value >= 90) return "Very High";
  if (value >= 75) return "High";
  if (value >= 60) return "Moderate";
  return "Low";
}

export default function ConfidenceBar({
  value,
  showLabel = true,
}: ConfidenceBarProps) {
  const label = getLabel(value);
  const color = getColor(value);

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">AI Confidence</span>
          <span className="font-semibold text-slate-900">
            {value}%{" "}
            <span className="font-normal text-slate-500">({label})</span>
          </span>
        </div>
      )}
      <div
        className="confidence-bar-track h-1.5 w-full"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI confidence: ${value}% — ${label}`}
      >
        <div
          className={`confidence-bar-fill h-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
