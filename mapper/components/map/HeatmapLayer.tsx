// ============================================================
// NEXUS — Deck.gl HeatmapLayer (Member 3: Mapper)
// ============================================================
import { HeatmapLayer as DeckHeatmapLayer } from "@deck.gl/aggregation-layers";
import type { ComplaintPoint } from "@/lib/types";
import { HEATMAP_COLOR_RANGE } from "@/lib/scoring";

export function HeatmapLayer(points: ComplaintPoint[]) {
  return new DeckHeatmapLayer<ComplaintPoint>({
    id: "nexus-heatmap",
    data: points,
    getPosition: (d) => [d.lng, d.lat],
    getWeight: (d) => d.complaint_volume,
    radiusPixels: 60,
    intensity: 1.2,
    threshold: 0.05,
    colorRange: HEATMAP_COLOR_RANGE,
    opacity: 0.7,
    pickable: false,
  });
}
