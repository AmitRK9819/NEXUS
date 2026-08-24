import { GeoJsonLayer } from "@deck.gl/layers";
import type { Feature, Polygon } from "geojson";
import { useMapStore } from "@/store/mapStore";

interface InvProperties {
  id: string;
  name: string;
  budget_usd: number;
  category: string;
  region: string;
  year: number;
}

export function InvestmentLayer() {
  const investments = useMapStore.getState().investments;

  const features: Feature<Polygon, InvProperties>[] = investments.map((inv) => ({
    type: "Feature",
    properties: {
      id: inv.id,
      name: inv.name,
      budget_usd: inv.budget_usd,
      category: inv.category,
      region: inv.region,
      year: inv.year,
    },
    geometry: {
      type: "Polygon",
      coordinates: inv.coordinates,
    },
  }));

  return new GeoJsonLayer<InvProperties>({
    id: "nexus-investments",
    data: { type: "FeatureCollection", features },
    filled: true,
    stroked: true,
    getFillColor: [139, 92, 246, 45],
    getLineColor: [167, 139, 250, 200],
    getLineWidth: 2,
    lineWidthMinPixels: 2,
    pickable: true,
    autoHighlight: true,
    highlightColor: [167, 139, 250, 80],
  });
}
