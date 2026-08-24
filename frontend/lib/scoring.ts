import type { ComplaintPoint, SeverityLevel } from "@/types/map";

export const SCORING_WEIGHTS = {
  volume: 0.40,
  infraDeficit: 0.35,
  populationDensity: 0.25,
} as const;

export function validateWeights(): boolean {
  const sum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1.0) < 1e-9;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export interface ScoringContext {
  maxVolume: number;
  maxDensity: number;
}

export function computeSeverityScore(
  point: Pick<ComplaintPoint, "complaint_volume" | "infra_deficit" | "population_density">,
  ctx: ScoringContext
): number {
  const normVolume = normalize(point.complaint_volume, 0, ctx.maxVolume);
  const normDeficit = normalize(point.infra_deficit, 0, 100);
  const normDensity = normalize(point.population_density, 0, ctx.maxDensity);

  const score =
    SCORING_WEIGHTS.volume * normVolume +
    SCORING_WEIGHTS.infraDeficit * normDeficit +
    SCORING_WEIGHTS.populationDensity * normDensity;

  return Math.max(0, Math.min(1, score));
}

export function buildScoringContext(points: ComplaintPoint[]): ScoringContext {
  if (points.length === 0) return { maxVolume: 1, maxDensity: 1 };
  return {
    maxVolume: points.reduce((max, p) => Math.max(max, p.complaint_volume), 0),
    maxDensity: points.reduce((max, p) => Math.max(max, p.population_density), 0),
  };
}

export function scoreToLevel(score: number): SeverityLevel {
  if (score <= 0.30) return "low";
  if (score <= 0.55) return "moderate";
  if (score <= 0.75) return "high";
  return "critical";
}

export function severityToColor(level: SeverityLevel): [number, number, number, number] {
  switch (level) {
    case "low":      return [74, 222, 128, 200];   // green-400
    case "moderate": return [250, 204, 21, 210];   // yellow-400
    case "high":     return [251, 146, 60, 220];   // orange-400
    case "critical": return [239, 68, 68, 240];    // red-500
  }
}

export const HEATMAP_COLOR_RANGE: [number, number, number][] = [
  [74, 222, 128],   // low (green)
  [250, 204, 21],   // moderate (yellow)
  [251, 146, 60],   // high (orange)
  [239, 68, 68],    // critical (red)
  [185, 28, 28],    // extreme (dark red)
];
