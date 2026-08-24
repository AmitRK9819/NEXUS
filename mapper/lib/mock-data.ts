// ============================================================
// NEXUS — Synthetic Mock Dataset (Member 3: Mapper)
// 500 complaint points across 5 BRICS cities, 6 months
//
// DEPLOYMENT NOTE: Data generation is wrapped in a closure
// to avoid mutable module-level state that causes SSR
// hydration mismatches. The seed resets each invocation.
// ============================================================

import type { ComplaintPoint, InvestmentZone, BRICSCountry, ComplaintCategory } from "./types";

// ------ BRICS city centres ------
const CITIES = [
  { city: "Mumbai",       country: "India"        as BRICSCountry, lat: 19.076,  lng: 72.877,  densityBase: 29_000 },
  { city: "São Paulo",    country: "Brazil"       as BRICSCountry, lat: -23.550, lng: -46.633, densityBase: 12_000 },
  { city: "Moscow",       country: "Russia"       as BRICSCountry, lat: 55.755,  lng: 37.617,  densityBase:  4_700 },
  { city: "Chengdu",      country: "China"        as BRICSCountry, lat: 30.572,  lng: 104.066, densityBase:  8_500 },
  { city: "Johannesburg", country: "South Africa" as BRICSCountry, lat: -26.204, lng: 28.047,  densityBase:  2_900 },
];

const CATEGORIES: ComplaintCategory[] = [
  "Water Supply",
  "Roads",
  "Digital Connectivity",
  "Sanitation",
  "Energy",
];

// 6-month window: Jan–Jun 2025
const START_MS = new Date("2025-01-01").getTime();
const END_MS   = new Date("2025-06-30").getTime();

// ------ Deterministic data generation in a closure ------
// Avoids mutable module-level `seed` that causes SSR hydration mismatches
function generateMockData() {
  // Seeded PRNG — reset fresh every time this function runs
  let seed = 42;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return ((seed >>> 0) / 0xffffffff);
  }
  function randRange(min: number, max: number): number {
    return min + rand() * (max - min);
  }
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)];
  }

  // Generate 500 complaint points
  const complaints: ComplaintPoint[] = Array.from({ length: 500 }, (_, i) => {
    const city     = CITIES[i % CITIES.length];
    const category = pick(CATEGORIES);
    const volume   = Math.round(randRange(10, 1500));
    const deficit  = Math.round(randRange(10, 95));
    const density  = Math.round(city.densityBase * randRange(0.4, 1.6));
    const ts       = new Date(START_MS + rand() * (END_MS - START_MS)).toISOString();
    const conf     = parseFloat(randRange(0.55, 0.99).toFixed(2));

    // Scatter around the city centre
    const lat = city.lat + randRange(-0.35, 0.35);
    const lng = city.lng + randRange(-0.35, 0.35);

    return {
      id:                 `CPT-${String(i + 1).padStart(4, "0")}`,
      lat:                parseFloat(lat.toFixed(5)),
      lng:                parseFloat(lng.toFixed(5)),
      category,
      severity_score:     parseFloat((0.40 * (volume / 1500) + 0.35 * (deficit / 100) + 0.25 * (density / 46400)).toFixed(3)),
      complaint_volume:   volume,
      infra_deficit:      deficit,
      population_density: density,
      timestamp:          ts,
      confidence_score:   conf,
      region:             city.city,
      country:            city.country,
    };
  });

  // Investment zones (GeoJSON polygons)
  const investments: InvestmentZone[] = [
    {
      id: "INV-001",
      name: "Mumbai Sports Complex",
      region: "Mumbai",
      budget_usd: 280_000_000,
      category: "Recreation",
      year: 2024,
      country: "India",
      coordinates: [[
        [72.820, 19.020], [72.920, 19.020],
        [72.920, 19.100], [72.820, 19.100], [72.820, 19.020],
      ]],
    },
    {
      id: "INV-002",
      name: "São Paulo Metro Line 6",
      region: "São Paulo",
      budget_usd: 1_200_000_000,
      category: "Transport",
      year: 2023,
      country: "Brazil",
      coordinates: [[
        [-46.700, -23.580], [-46.580, -23.580],
        [-46.580, -23.520], [-46.700, -23.520], [-46.700, -23.580],
      ]],
    },
    {
      id: "INV-003",
      name: "Moscow Tech Park",
      region: "Moscow",
      budget_usd: 540_000_000,
      category: "Technology",
      year: 2025,
      country: "Russia",
      coordinates: [[
        [37.560, 55.720], [37.660, 55.720],
        [37.660, 55.790], [37.560, 55.790], [37.560, 55.720],
      ]],
    },
    {
      id: "INV-004",
      name: "Chengdu High-Speed Rail Hub",
      region: "Chengdu",
      budget_usd: 920_000_000,
      category: "Transport",
      year: 2024,
      country: "China",
      coordinates: [[
        [104.020, 30.530], [104.110, 30.530],
        [104.110, 30.610], [104.020, 30.610], [104.020, 30.530],
      ]],
    },
    {
      id: "INV-005",
      name: "Johannesburg Business District",
      region: "Johannesburg",
      budget_usd: 160_000_000,
      category: "Commerce",
      year: 2025,
      country: "South Africa",
      coordinates: [[
        [28.010, -26.230], [28.080, -26.230],
        [28.080, -26.180], [28.010, -26.180], [28.010, -26.230],
      ]],
    },
  ];

  return { complaints, investments };
}

// Execute once at module load — seed is encapsulated, so results are
// identical on server and client (no hydration mismatch).
const _generated = generateMockData();
export const MOCK_COMPLAINTS: ComplaintPoint[]  = _generated.complaints;
export const MOCK_INVESTMENTS: InvestmentZone[] = _generated.investments;

// ------ Helper: filter by category ------
export function filterByCategory(
  points: ComplaintPoint[],
  categories: ComplaintCategory[]
): ComplaintPoint[] {
  if (categories.length === 0) return [];
  return points.filter((p) => categories.includes(p.category));
}

// ------ Helper: filter by time window (unix ms) ------
export function filterByTimeRange(
  points: ComplaintPoint[],
  start: number,
  end: number
): ComplaintPoint[] {
  return points.filter((p) => {
    const t = new Date(p.timestamp).getTime();
    return t >= start && t <= end;
  });
}

// ------ Helper: top N hotspots by severity ------
export function getTopHotspots(points: ComplaintPoint[], n = 5): ComplaintPoint[] {
  return [...points].sort((a, b) => b.severity_score - a.severity_score).slice(0, n);
}
