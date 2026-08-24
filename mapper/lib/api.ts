// ============================================================
// NEXUS — API Client (Member 3: Mapper)
// Falls back to mock data when NEXT_PUBLIC_API_URL is not set
//
// DEPLOYMENT NOTE: NEXT_PUBLIC_* env vars are inlined at build
// time by Next.js. Set the env var BEFORE running `next build`.
// ============================================================

import type { ComplaintPoint, InvestmentZone, ApiResponse } from "./types";

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
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
      category: f.properties.category,
      severity: f.properties.sentiment < -0.3 ? "critical" : f.properties.sentiment < 0 ? "high" : "medium",
      description: f.properties.raw_text ?? "",
      timestamp: new Date().toISOString(),
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
      category: b.category,
      budget: b.allocated_budget_usd,
      status: b.status,
      coordinates: [0, 0] as [number, number], // Position from region centroid
    }));
  } catch {
    const { MOCK_INVESTMENTS } = await import("./mock-data");
    return MOCK_INVESTMENTS;
  }
}
