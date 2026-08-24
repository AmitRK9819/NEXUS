// ============================================================
// NEXUS — Unit Tests: Severity Scoring Algorithm
// Run: npx jest lib/__tests__/scoring.test.ts
// ============================================================

import {
  computeSeverityScore,
  buildScoringContext,
  scoreToLevel,
  validateWeights,
  SCORING_WEIGHTS,
} from "../scoring";
import type { ComplaintPoint } from "../types";

// Helper: make minimal ComplaintPoint fixtures
function makePoint(
  volume: number,
  deficit: number,
  density: number
): ComplaintPoint {
  return {
    id: "test",
    lat: 0, lng: 0,
    category: "Roads",
    severity_score: 0,
    complaint_volume: volume,
    infra_deficit: deficit,
    population_density: density,
    timestamp: "2025-01-01T00:00:00Z",
    confidence_score: 0.9,
    region: "TestRegion",
    country: "India",
  };
}

// ---- T-S-04 ------------------------------------------------
describe("Weight validation", () => {
  it("T-S-04: weights must sum to exactly 1.0", () => {
    expect(validateWeights()).toBe(true);
    const sum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(1e-9);
  });
});

// ---- T-S-01 ------------------------------------------------
describe("computeSeverityScore — boundary conditions", () => {
  it("T-S-01: max inputs → score ≈ 1.0", () => {
    const ctx = { maxVolume: 1000, maxDensity: 10000 };
    const p = makePoint(1000, 100, 10000);
    const score = computeSeverityScore(p, ctx);
    expect(score).toBeCloseTo(1.0, 2);
  });

  // ---- T-S-02 ------------------------------------------------
  it("T-S-02: zero inputs → score = 0.0", () => {
    const ctx = { maxVolume: 1000, maxDensity: 10000 };
    const p = makePoint(0, 0, 0);
    const score = computeSeverityScore(p, ctx);
    expect(score).toBeCloseTo(0.0, 2);
  });

  // ---- T-S-03 ------------------------------------------------
  it("T-S-03: mid-range inputs → score ≈ 0.5", () => {
    const ctx = { maxVolume: 1000, maxDensity: 10000 };
    const p = makePoint(500, 50, 5000);
    const score = computeSeverityScore(p, ctx);
    // 0.40*0.5 + 0.35*0.5 + 0.25*0.5 = 0.5
    expect(score).toBeCloseTo(0.5, 2);
  });

  // ---- T-S-05 ------------------------------------------------
  it("T-S-05: 1000 random inputs always in [0, 1]", () => {
    const ctx = { maxVolume: 1500, maxDensity: 50000 };
    for (let i = 0; i < 1000; i++) {
      const volume  = Math.random() * 1500;
      const deficit = Math.random() * 100;
      const density = Math.random() * 50000;
      const p = makePoint(volume, deficit, density);
      const score = computeSeverityScore(p, ctx);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

// ---- scoreToLevel mapping --------------------------------
describe("scoreToLevel", () => {
  it("0.00 → low", () => expect(scoreToLevel(0.00)).toBe("low"));
  it("0.30 → low", () => expect(scoreToLevel(0.30)).toBe("low"));
  it("0.31 → moderate", () => expect(scoreToLevel(0.31)).toBe("moderate"));
  it("0.55 → moderate", () => expect(scoreToLevel(0.55)).toBe("moderate"));
  it("0.56 → high", () => expect(scoreToLevel(0.56)).toBe("high"));
  it("0.75 → high", () => expect(scoreToLevel(0.75)).toBe("high"));
  it("0.76 → critical", () => expect(scoreToLevel(0.76)).toBe("critical"));
  it("1.00 → critical", () => expect(scoreToLevel(1.00)).toBe("critical"));
});

// ---- buildScoringContext ---------------------------------
describe("buildScoringContext", () => {
  it("returns max values from dataset", () => {
    const points = [
      makePoint(100, 50, 1000),
      makePoint(500, 80, 5000),
      makePoint(200, 30, 3000),
    ];
    const ctx = buildScoringContext(points);
    expect(ctx.maxVolume).toBe(500);
    expect(ctx.maxDensity).toBe(5000);
  });

  it("returns safe defaults for empty dataset", () => {
    const ctx = buildScoringContext([]);
    expect(ctx.maxVolume).toBeGreaterThan(0);
    expect(ctx.maxDensity).toBeGreaterThan(0);
  });
});
