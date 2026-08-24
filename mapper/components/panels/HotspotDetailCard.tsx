"use client";
// ============================================================
// NEXUS — Hotspot Detail Card (slide-in panel on cluster click)
// ============================================================

import { useState } from "react";
import { useMapStore } from "@/store/mapStore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { scoreToLevel } from "@/lib/scoring";
import type { ComplaintCategory } from "@/lib/types";

const CAT_COLORS: Record<ComplaintCategory, string> = {
  "Water Supply":        "#22d3ee",
  "Roads":               "#facc15",
  "Digital Connectivity":"#a78bfa",
  "Sanitation":          "#4ade80",
  "Energy":              "#fb923c",
};

const FLAG: Record<string, string> = {
  "India": "🇮🇳", "Brazil": "🇧🇷", "Russia": "🇷🇺",
  "China": "🇨🇳", "South Africa": "🇿🇦",
};

const LEVEL_COLOR: Record<string, string> = {
  critical: "text-red-400", high: "text-orange-400",
  moderate: "text-yellow-400", low: "text-green-400",
};

export default function HotspotDetailCard() {
  const { complaints, selectedHotspotId, selectHotspot } = useMapStore();
  const [forwarded, setForwarded] = useState(false);
  const point = complaints.find((p) => p.id === selectedHotspotId);

  if (!point) return null;

  const level = scoreToLevel(point.severity_score);

  // Build pie chart data from complaints in the same region
  const regionComplaints = complaints.filter((p) => p.region === point.region);
  const byCategory = Object.entries(
    regionComplaints.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{FLAG[point.country] ?? "🌐"}</span>
            <h3 className="text-white font-semibold">{point.region}</h3>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">{point.country} · {point.category}</p>
        </div>
        <button
          onClick={() => selectHotspot(null)}
          aria-label="Close detail card"
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Severity score */}
      <div className="bg-gray-800/60 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-400 text-xs">Severity Score</span>
          <span className={`text-sm font-bold capitalize ${LEVEL_COLOR[level]}`}>
            {level} · {point.severity_score.toFixed(3)}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full transition-all"
            style={{ width: `${point.severity_score * 100}%` }}
          />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Requests",  value: point.complaint_volume.toLocaleString() },
          { label: "Deficit",   value: `${point.infra_deficit}/100` },
          { label: "Confidence",value: `${Math.round(point.confidence_score * 100)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800/60 rounded-xl p-2 text-center">
            <p className="text-white text-sm font-bold">{value}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Category distribution pie */}
      <div className="mb-3">
        <p className="text-gray-400 text-xs mb-2">Regional demand breakdown</p>
        <ResponsiveContainer width="100%" height={110}>
          <PieChart>
            <Pie data={byCategory} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" paddingAngle={3}>
              {byCategory.map((entry) => (
                <Cell key={entry.name} fill={CAT_COLORS[entry.name as ComplaintCategory] ?? "#6b7280"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelStyle={{ color: "#f9fafb" }}
              itemStyle={{ color: "#d1d5db" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {byCategory.map(({ name }) => (
            <span key={name} className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: CAT_COLORS[name as ComplaintCategory] ?? "#6b7280" }} />
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Forward CTA → Member 4 (DC-05: toast instead of alert) */}
      <button
        id={`forward-hotspot-${point.id}`}
        aria-label={`Forward hotspot ${point.id} to policymaker dashboard`}
        disabled={forwarded}
        onClick={() => {
          // Emit a custom event that Member 4's dashboard can listen for
          window.dispatchEvent(new CustomEvent("nexus:forward-hotspot", { detail: point }));
          setForwarded(true);
          setTimeout(() => setForwarded(false), 3000);
        }}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
          forwarded
            ? "bg-green-500/20 text-green-300 border border-green-500/40 cursor-default"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
        }`}
      >
        {forwarded ? "✓ Forwarded to Policymaker Dashboard" : "→ Forward to Policymaker Dashboard"}
      </button>

      {/* Timestamp */}
      <p className="text-gray-600 text-xs text-center mt-2">
        ID: {point.id} · {new Date(point.timestamp).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
