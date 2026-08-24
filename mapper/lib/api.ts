// ============================================================
// NEXUS — API Client (Member 3: Mapper)
// Falls back to mock data when NEXT_PUBLIC_API_URL is not set
//
// DEPLOYMENT NOTE: NEXT_PUBLIC_* env vars are inlined at build
// time by Next.js. Set the env var BEFORE running `next build`.
// ============================================================

import type { ComplaintPoint, InvestmentZone, ComplaintCategory, BRICSCountry } from "./types";

// ----------------------------------------------------------
// Resolve API base URL at call-time so it picks up the
// build-time inline.
// ----------------------------------------------------------
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

// ----------------------------------------------------------
// Generic fetch helper with timeout + error handling
// ----------------------------------------------------------
async function apiFetch<T>(baseUrl: string, path: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCategory(cat: string): ComplaintCategory {
  const lower = (cat || "").toLowerCase();
  if (lower.includes("water")) return "Water Supply";
  if (lower.includes("road")) return "Roads";
  if (lower.includes("sanitation") || lower.includes("waste")) return "Sanitation";
  if (lower.includes("internet") || lower.includes("digital")) return "Digital Connectivity";
  return "Energy";
}

// ----------------------------------------------------------
// Complaints endpoint
// Backend: GET /api/v1/analytics/hotspots → GeoJSON FeatureCollection
// Mock:    GET /api/hotspots (Next.js API route)
// ----------------------------------------------------------
export async function fetchComplaints(): Promise<ComplaintPoint[]> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    // Lazy-import mock data so it's tree-shaken in production
    const { MOCK_COMPLAINTS } = await import("./mock-data");
    await new Promise((r) => setTimeout(r, 300)); // simulate latency
    return MOCK_COMPLAINTS;
  }

  // Fetch from the real backend GeoJSON endpoint
  try {
    const geojson = await apiFetch<{
      type: string;
      features: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          id?: string;
          category: string;
          sentiment: number;
          confidence_score: number;
          raw_text?: string;
          language?: string;
        };
      }>;
    }>(baseUrl, "/api/v1/analytics/hotspots");

    return geojson.features.map((f) => ({
      id: f.properties.id ?? crypto.randomUUID(),
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      category: normalizeCategory(f.properties.category),
      severity_score: Math.max(0, Math.min(1, 1 - (f.properties.sentiment + 1) / 2)),
      complaint_volume: 1,
      infra_deficit: 70,
      population_density: 8000,
      timestamp: new Date().toISOString(),
      confidence_score: f.properties.confidence_score ?? 0.9,
      region: "Gauteng",
      country: "South Africa" as BRICSCountry,
    }));
  } catch {
    // Fallback to mock data on error
    const { MOCK_COMPLAINTS } = await import("./mock-data");
    return MOCK_COMPLAINTS;
  }
}

// ----------------------------------------------------------
// Investment zones endpoint
// Backend: GET /api/v1/national-data/budgets → budget array
// Mock:    GET /api/investments (Next.js API route)
// ----------------------------------------------------------
export async function fetchInvestments(): Promise<InvestmentZone[]> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    const { MOCK_INVESTMENTS } = await import("./mock-data");
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_INVESTMENTS;
  }

  try {
    const budgets = await apiFetch<Array<{
      id: string;
      region_id: string;
      project_name: string;
      category: string;
      allocated_budget_usd: number;
      status: string;
    }>>(baseUrl, "/api/v1/national-data/budgets");

    return budgets.map((b) => ({
      id: b.id,
      name: b.project_name,
      region: "Gauteng",
      budget_usd: b.allocated_budget_usd,
      category: b.category,
      coordinates: [
        [
          [28.0, -26.2],
          [28.1, -26.2],
          [28.1, -26.3],
          [28.0, -26.3],
          [28.0, -26.2],
        ],
      ],
      year: 2026,
      country: "South Africa" as BRICSCountry,
    }));
  } catch {
    const { MOCK_INVESTMENTS } = await import("./mock-data");
    return MOCK_INVESTMENTS;
  }
}
