"use client";

import { useMapStore } from "@/store/mapStore";
import { useCallback } from "react";

const MONTHS = ["Jan 25", "Apr 25", "Aug 25", "Dec 25", "Apr 26", "Aug 26"];
const START_MS = new Date("2025-01-01").getTime();
const END_MS   = new Date("2026-12-31").getTime();
const TOTAL_MS = END_MS - START_MS;

function msToPercent(ms: number): number {
  return Math.round(((ms - START_MS) / TOTAL_MS) * 100);
}

export default function TimeSlider() {
  const { timeRange, setTimeRange } = useMapStore();
  const [tStart, tEnd] = timeRange;

  const handleStart = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const ms = START_MS + (val / 100) * TOTAL_MS;
      if (ms < tEnd) setTimeRange([ms, tEnd]);
    },
    [tEnd, setTimeRange]
  );

  const handleEnd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const ms = START_MS + (val / 100) * TOTAL_MS;
      if (ms > tStart) setTimeRange([tStart, ms]);
    },
    [tStart, setTimeRange]
  );

  const startPct = msToPercent(tStart);
  const endPct   = msToPercent(tEnd);

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm font-semibold">Time Window</h2>
        <span className="text-cyan-400 text-xs font-mono">
          {new Date(tStart).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })} → {new Date(tEnd).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
        </span>
      </div>

      <div className="relative h-6 flex items-center" role="group" aria-label="Time range selector">
        <div className="absolute w-full h-1.5 bg-gray-700 rounded-full" />
        <div
          className="absolute h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />

        <input
          type="range"
          min={0}
          max={100}
          value={startPct}
          onChange={handleStart}
          aria-label="Start of time range"
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          style={{ pointerEvents: "all" }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={endPct}
          onChange={handleEnd}
          aria-label="End of time range"
          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
          style={{ pointerEvents: "all" }}
        />

        <div
          className="absolute w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-lg pointer-events-none z-30 -translate-x-2"
          style={{ left: `${startPct}%` }}
        />
        <div
          className="absolute w-4 h-4 bg-blue-400 border-2 border-white rounded-full shadow-lg pointer-events-none z-30 -translate-x-2"
          style={{ left: `${endPct}%` }}
        />
      </div>

      <div className="flex justify-between mt-3">
        {MONTHS.map((m) => (
          <span key={m} className="text-gray-500 text-[10px]">{m}</span>
        ))}
      </div>
    </div>
  );
}
