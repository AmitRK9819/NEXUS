"use client";

export default function SeverityLegend() {
  const levels = [
    { label: "Critical",  range: "0.76–1.00", color: "bg-red-500" },
    { label: "High",      range: "0.56–0.75", color: "bg-orange-400" },
    { label: "Moderate",  range: "0.31–0.55", color: "bg-yellow-400" },
    { label: "Low",       range: "0.00–0.30", color: "bg-green-400" },
  ];

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
      <h2 className="text-white text-sm font-semibold mb-3">Severity Scale</h2>
      <div className="flex flex-col gap-2">
        {levels.map(({ label, range, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
            <span className="text-white text-xs font-medium w-16">{label}</span>
            <span className="text-gray-500 text-xs font-mono">{range}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-purple-400 flex-shrink-0 bg-purple-500/30" />
          <span className="text-purple-300 text-xs">Public Budget Zone</span>
        </div>
      </div>
    </div>
  );
}
