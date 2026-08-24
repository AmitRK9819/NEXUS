"use client";

import { useMapStore } from "@/store/mapStore";
import { scoreToLevel } from "@/lib/scoring";

const LEVEL_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high:     "bg-orange-500/20 text-orange-300 border-orange-500/40",
  moderate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  low:      "bg-green-500/20 text-green-300 border-green-500/40",
};

export default function StatsPanel() {
  const { filteredComplaints, selectedHotspotId, selectHotspot } = useMapStore();
  const points = filteredComplaints();

  const total = points.length;
  const avgSeverity = total > 0
    ? (points.reduce((s, p) => s + p.severity_score, 0) / total).toFixed(2)
    : "—";

  const top5 = [...points]
    .sort((a, b) => b.severity_score - a.severity_score)
    .slice(0, 5);

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
      <h2 className="text-white text-sm font-semibold mb-3">Top Priority Hotspots</h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-800/60 rounded-xl p-2 text-center">
          <p className="text-cyan-400 text-lg font-bold">{total}</p>
          <p className="text-gray-500 text-xs">Total Records</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-2 text-center">
          <p className="text-orange-400 text-lg font-bold">{avgSeverity}</p>
          <p className="text-gray-500 text-xs">Avg Severity</p>
        </div>
      </div>

      {top5.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-4">No data for selected filters</p>
      ) : (
        <div className="flex flex-col gap-2">
          {top5.map((p, idx) => {
            const level = scoreToLevel(p.severity_score);
            const isSelected = p.id === selectedHotspotId;
            return (
              <button
                key={p.id}
                onClick={() => selectHotspot(isSelected ? null : p.id)}
                className={`
                  flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200
                  ${isSelected
                    ? "bg-white/10 border-white/20"
                    : "bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/70"
                  }
                `}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-bold mt-0.5">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-white text-xs font-semibold truncate">{p.region}</span>
                    <span className={`ml-auto flex-shrink-0 text-xs px-1.5 py-0.5 rounded border capitalize ${LEVEL_BADGE[level]}`}>
                      {level}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{p.category}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-red-500 rounded-full transition-all"
                        style={{ width: `${p.severity_score * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs font-mono flex-shrink-0">
                      {p.severity_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
