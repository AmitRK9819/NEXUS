"use client";

import dynamic from "next/dynamic";

const MapDashboard = dynamic(
  () => import("@/components/map/MapDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-cyan-300">Initializing Deck.gl & PostGIS Map Engine…</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return <MapDashboard />;
}
