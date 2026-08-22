"use client";
// ============================================================
// NEXUS — Time Slider (6-month range, Jan–Jun 2025)
// ============================================================

import { useMapStore } from "@/store/mapStore";
import { useCallback } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const START_MS = new Date("2025-01-01").getTime();
const END_MS   = new Date("2025-06-30").getTime();
const TOTAL_MS = END_MS - START_MS;

function msToLabel(ms: number): string {
  const idx = Math.min(5, Math.floor(((ms - START_MS) / TOTAL_MS) * 6));
  return MONTHS[idx];
}

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
          {msToLabel(tStart)} → {msToLabel(tEnd)} 2025
        </span>
      </div>

      {/* Dual range slider */}
      <div className="relative h-6 flex items-center" role="group" aria-label="Time range selector">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-gray-700 rounded-full" />
        {/* Active track */}
        <div
          className="absolute h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />

        {/* Start thumb */}
        <input
          id="time-slider-start"
          type="range"
          min={0}
          max={100}
          value={startPct}
          onChange={handleStart}
          aria-label="Start of time range"
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          style={{ pointerEvents: "all" }}
        />
        {/* End thumb */}
        <input
          id="time-slider-end"
          type="range"
          min={0}
          max={100}
          value={endPct}
          onChange={handleEnd}
          aria-label="End of time range"
          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
          style={{ pointerEvents: "all" }}
        />

        {/* Visual thumbs */}
        <div
          className="absolute w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-lg pointer-events-none z-30 -translate-x-2"
          style={{ left: `${startPct}%` }}
        />
        <div
          className="absolute w-4 h-4 bg-blue-400 border-2 border-white rounded-full shadow-lg pointer-events-none z-30 -translate-x-2"
          style={{ left: `${endPct}%` }}
        />
      </div>

      {/* Month labels */}
      <div className="flex justify-between mt-3">
        {MONTHS.map((m) => (
          <span key={m} className="text-gray-500 text-xs">{m}</span>
        ))}
      </div>
    </div>
  );
}
