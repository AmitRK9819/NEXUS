// ============================================================
// NEXUS — API Client (Member 3: Mapper)
// Falls back to mock data when NEXT_PUBLIC_API_URL is not set
// ============================================================

import type { ComplaintPoint, InvestmentZone, ApiResponse } from "./types";
import { MOCK_COMPLAINTS, MOCK_INVESTMENTS } from "./mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_MOCK = !BASE_URL;

// ----------------------------------------------------------
// Generic fetch helper with timeout + error handling
// ----------------------------------------------------------
async function apiFetch<T>(path: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
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
  if (USE_MOCK) {
    // Simulate network latency in dev
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_COMPLAINTS;
  }
  const res = await apiFetch<ApiResponse<ComplaintPoint[]>>("/api/hotspots");
  return res.data;
}

// ----------------------------------------------------------
// Investment zones endpoint
// GET /api/investments  →  ApiResponse<InvestmentZone[]>
// ----------------------------------------------------------
export async function fetchInvestments(): Promise<InvestmentZone[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_INVESTMENTS;
  }
  const res = await apiFetch<ApiResponse<InvestmentZone[]>>("/api/investments");
  return res.data;
}
