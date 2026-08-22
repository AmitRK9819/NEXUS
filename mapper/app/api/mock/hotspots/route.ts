// ============================================================
// NEXUS — Mock API: GET /api/mock/hotspots
// Returns synthetic complaint data for local development
// ============================================================
import { NextResponse } from "next/server";
import { MOCK_COMPLAINTS } from "@/lib/mock-data";

export async function GET() {
  // Simulate a brief DB query delay
  await new Promise((r) => setTimeout(r, 100));

  return NextResponse.json({
    data: MOCK_COMPLAINTS,
    total: MOCK_COMPLAINTS.length,
    generated_at: new Date().toISOString(),
  });
}
