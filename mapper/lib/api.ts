// ============================================================
// NEXUS — API Client (Member 3: Mapper)
// Falls back to mock data when NEXT_PUBLIC_API_URL is not set
//
// DEPLOYMENT NOTE: NEXT_PUBLIC_* env vars are inlined at build
// time by Next.js. Set the env var BEFORE running `next build`.
// The runtime check below is a safety net, not a guarantee.
// ============================================================

import type { ComplaintPoint, InvestmentZone, ApiResponse } from "./types";

// ----------------------------------------------------------
// Resolve API base URL at call-time so it picks up the
// build-time inline. We check inside each function rather
// than at module scope to allow proper tree-shaking of
// the mock-data module when a real URL is provided.
// ----------------------------------------------------------
function getBaseUrl(): string {
  // In production builds, Next.js replaces this literal at compile time.
  // This is intentional — NEXT_PUBLIC vars are NOT runtime-configurable.
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
// GET /api/hotspots  →  ApiResponse<ComplaintPoint[]>
// ----------------------------------------------------------
export async function fetchComplaints(): Promise<ComplaintPoint[]> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    // Lazy-import mock data so it's tree-shaken in production
    const { MOCK_COMPLAINTS } = await import("./mock-data");
    await new Promise((r) => setTimeout(r, 300)); // simulate latency
    return MOCK_COMPLAINTS;
  }
  const res = await apiFetch<ApiResponse<ComplaintPoint[]>>(baseUrl, "/api/hotspots");
  return res.data;
}

// ----------------------------------------------------------
// Investment zones endpoint
// GET /api/investments  →  ApiResponse<InvestmentZone[]>
// ----------------------------------------------------------
export async function fetchInvestments(): Promise<InvestmentZone[]> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    const { MOCK_INVESTMENTS } = await import("./mock-data");
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_INVESTMENTS;
  }
  const res = await apiFetch<ApiResponse<InvestmentZone[]>>(baseUrl, "/api/investments");
  return res.data;
}
