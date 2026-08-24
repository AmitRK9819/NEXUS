import type { ComplaintPoint, InvestmentZone, ComplaintCategory } from "@/types/map";
import { MOCK_COMPLAINTS, MOCK_INVESTMENTS } from "@/lib/map-mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    category?: string;
    sentiment?: number;
    confidence_score?: number;
    raw_text?: string;
    language?: string;
    status?: string;
  };
}

export interface GeoJsonHotspotsResponse {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  metadata?: {
    total_complaints: number;
    hotspot_regions: number;
    regions_analyzed: number;
  };
}

export interface BudgetResponseItem {
  id: string;
  region_id: string;
  project_name: string;
  category: string;
  allocated_budget_usd: number;
  start_date: string;
  status: string;
}

const CATEGORY_MAP: Record<string, ComplaintCategory> = {
  Roads: "Roads",
  Water: "Water Supply",
  "Water Supply": "Water Supply",
  Sanitation: "Sanitation",
  Internet: "Digital Connectivity",
  "Digital Connectivity": "Digital Connectivity",
  Other: "Energy",
  Energy: "Energy",
};

export async function fetchComplaints(): Promise<ComplaintPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/analytics/hotspots`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: GeoJsonHotspotsResponse = await res.json();
    if (!data.features || data.features.length === 0) {
      return MOCK_COMPLAINTS;
    }

    return data.features.map((f, i) => {
      const [lng, lat] = f.geometry.coordinates;
      const catKey = f.properties.category || "Roads";
      const category: ComplaintCategory = CATEGORY_MAP[catKey] || "Roads";
      const sentiment = f.properties.sentiment ?? 0;
      const severity_score = parseFloat(
        Math.max(0.1, Math.min(1.0, (1 - (sentiment + 1) / 2) * 0.7 + 0.3)).toFixed(3)
      );

      return {
        id: f.properties.id || `complaint-${i + 1}`,
        lat,
        lng,
        category,
        severity_score,
        complaint_volume: 1,
        infra_deficit: Math.round(severity_score * 100),
        population_density: 8000,
        timestamp: new Date().toISOString(),
        confidence_score: f.properties.confidence_score ?? 0.85,
        region: "Gauteng",
        country: "South Africa",
      };
    });
  } catch {
    return MOCK_COMPLAINTS;
  }
}

export async function fetchInvestments(): Promise<InvestmentZone[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/national-data/budgets`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: BudgetResponseItem[] = await res.json();
    if (!data || data.length === 0) {
      return MOCK_INVESTMENTS;
    }

    return data.map((b) => ({
      id: b.id,
      name: b.project_name,
      region: "Gauteng",
      budget_usd: b.allocated_budget_usd,
      category: b.category,
      coordinates: [
        [
          [28.00, -26.15],
          [28.10, -26.15],
          [28.10, -26.25],
          [28.00, -26.25],
          [28.00, -26.15],
        ],
      ],
      year: new Date(b.start_date).getFullYear() || 2026,
      country: "South Africa",
    }));
  } catch {
    return MOCK_INVESTMENTS;
  }
}

export async function fetchMisalignmentReport() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/analytics/misalignment`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch {
    return [];
  }
}

export async function fetchOversightQueue() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/governance/oversight-queue`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function approveOversightItem(itemId: string, status: "APPROVED" | "REJECTED" | "FLAGGED") {
  const res = await fetch(`${API_BASE}/api/v1/governance/oversight-queue/${itemId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
