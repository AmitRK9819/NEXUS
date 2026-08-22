"use client";
// ============================================================
// NEXUS — Main Map Dashboard Orchestrator (Member 3: Mapper)
// ============================================================

import { useEffect, useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMapStore } from "@/store/mapStore";
import { fetchComplaints, fetchInvestments } from "@/lib/api";
import { HeatmapLayer } from "./HeatmapLayer";
import { ClusterLayer } from "./ClusterLayer";
import { InvestmentLayer } from "./InvestmentLayer";
import CategoryFilter from "@/components/controls/CategoryFilter";
import TimeSlider from "@/components/controls/TimeSlider";
import SeverityLegend from "@/components/controls/SeverityLegend";
import StatsPanel from "@/components/panels/StatsPanel";
import HotspotDetailCard from "@/components/panels/HotspotDetailCard";

// BRICS-centred initial view
const INITIAL_VIEW = {
  longitude: 60,
  latitude: 20,
  zoom: 2.5,
  pitch: 30,
  bearing: 0,
};

export default function MapDashboard() {
  const {
    setComplaints, setInvestments, setLoading, setError,
    showHeatmap, showClusters, showInvestmentLayer,
    toggleHeatmap, toggleClusters, toggleInvestmentLayer,
    selectedHotspotId, isLoading, error,
    filteredComplaints,
  } = useMapStore();

  // ---- Load data on mount ----
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [complaints, investments] = await Promise.all([
        fetchComplaints(),
        fetchInvestments(),
      ]);
      setComplaints(complaints);
      setInvestments(investments);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [setComplaints, setInvestments, setLoading, setError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ---- Deck.gl layers ----
  const points = filteredComplaints();
  const layers = [
    showInvestmentLayer && InvestmentLayer(),
    showHeatmap && HeatmapLayer(points),
    showClusters && ClusterLayer(points),
  ].filter(Boolean);

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden">

      {/* ── Map Canvas ── */}
      <DeckGL
        initialViewState={INITIAL_VIEW}
        controller
        layers={layers as never[]}
        style={{ position: "absolute", inset: 0 }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" />
        </Map>
      </DeckGL>

      {/* ── Top Header Bar ── */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-950/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm tracking-wide">NEXUS</h1>
            <p className="text-gray-400 text-xs">Citizen Demand Hotspot Map — BRICS Regions</p>
          </div>
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-2">
          <LayerToggle label="Heatmap"    active={showHeatmap}         onClick={toggleHeatmap} />
          <LayerToggle label="Clusters"   active={showClusters}        onClick={toggleClusters} />
          <LayerToggle label="Investment" active={showInvestmentLayer}  onClick={toggleInvestmentLayer} color="purple" />
          <button
            onClick={loadData}
            className="ml-2 px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg transition-all"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-cyan-300 text-sm">Loading BRICS data…</p>
          </div>
        </div>
      )}

      {/* ── Error toast ── */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm backdrop-blur-md">
          ⚠ {error} —{" "}
          <button onClick={loadData} className="underline">Retry</button>
        </div>
      )}

      {/* ── Left Sidebar: Filters ── */}
      <aside className="absolute left-4 top-16 bottom-4 z-10 w-64 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <CategoryFilter />
        </div>
        <div className="pointer-events-auto">
          <TimeSlider />
        </div>
        <div className="pointer-events-auto mt-auto">
          <SeverityLegend />
        </div>
      </aside>

      {/* ── Right Sidebar: Stats ── */}
      <aside className="absolute right-4 top-16 bottom-4 z-10 w-72 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <StatsPanel />
        </div>
        {selectedHotspotId && (
          <div className="pointer-events-auto">
            <HotspotDetailCard />
          </div>
        )}
      </aside>

      {/* ── Bottom count badge ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-full text-xs text-gray-300">
        <span className="text-cyan-400 font-semibold">{points.length}</span> complaint points shown
      </div>
    </div>
  );
}

// Small reusable layer toggle button
function LayerToggle({
  label, active, onClick, color = "cyan",
}: { label: string; active: boolean; onClick: () => void; color?: string }) {
  const activeClass = color === "purple"
    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  const inactiveClass = "bg-gray-800/50 text-gray-500 border-gray-700";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${active ? activeClass : inactiveClass}`}
    >
      {label}
    </button>
  );
}
