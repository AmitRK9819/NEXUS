import dynamic from "next/dynamic";

// AR-05: Dynamically import MapDashboard with ssr: false to prevent
// WebGL/canvas APIs from executing during server-side rendering.
// This is critical for deployment to Edge runtimes (Vercel Edge,
// Cloudflare Workers) and static export targets.
const MapDashboard = dynamic(
  () => import("@/components/map/MapDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm">Loading NEXUS Map…</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <MapDashboard />;
}
