// ============================================================
// NEXUS — Mock API: GET /api/mock/investments
// Returns synthetic government investment zones
// ============================================================
import { NextResponse } from "next/server";
import { MOCK_INVESTMENTS } from "@/lib/mock-data";

export async function GET() {
  await new Promise((r) => setTimeout(r, 80));

  return NextResponse.json({
    data: MOCK_INVESTMENTS,
    total: MOCK_INVESTMENTS.length,
    generated_at: new Date().toISOString(),
  });
}
