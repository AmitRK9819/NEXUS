// ============================================================
// NEXUS — Deck.gl ClusterLayer (Member 3: Mapper)
// Scatterplot circles, sized + colored by severity score
// ============================================================
import { ScatterplotLayer } from "@deck.gl/layers";
import type { ComplaintPoint } from "@/lib/types";
import { scoreToLevel, severityToColor } from "@/lib/scoring";
import { useMapStore } from "@/store/mapStore";

export function ClusterLayer(points: ComplaintPoint[]) {
  const { selectHotspot, hoverHotspot } = useMapStore.getState();

  return new ScatterplotLayer<ComplaintPoint>({
    id: "nexus-clusters",
    data: points,
    getPosition: (d) => [d.lng, d.lat],
    getRadius: (d) => Math.max(6000, d.complaint_volume * 12),
    getFillColor: (d) => severityToColor(scoreToLevel(d.severity_score)),
    getLineColor: [255, 255, 255, 60],
    lineWidthMinPixels: 1,
    stroked: true,
    filled: true,
    radiusMinPixels: 6,
    radiusMaxPixels: 40,
    radiusUnits: "meters",
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    onClick: (info) => {
      if (info.object) selectHotspot(info.object.id);
    },
    onHover: (info) => {
      hoverHotspot(info.object ? info.object.id : null);
      // Change cursor
      if (typeof document !== "undefined") {
        document.body.style.cursor = info.object ? "pointer" : "default";
      }
    },
    updateTriggers: {
      getFillColor: points.map((p) => p.severity_score),
    },
  });
}
