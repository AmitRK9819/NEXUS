import type { ComplaintPoint, InvestmentZone, BRICSCountry, ComplaintCategory } from "@/types/map";

const CITIES = [
  { city: "Johannesburg", country: "South Africa" as BRICSCountry, lat: -26.204, lng: 28.047,  densityBase: 12_000 },
  { city: "Soweto",       country: "South Africa" as BRICSCountry, lat: -26.248, lng: 27.854,  densityBase:  8_500 },
  { city: "Sandton",      country: "South Africa" as BRICSCountry, lat: -26.107, lng: 28.057,  densityBase:  3_200 },
  { city: "Pretoria",     country: "South Africa" as BRICSCountry, lat: -25.747, lng: 28.188,  densityBase:  5_500 },
  { city: "Mamelodi",     country: "South Africa" as BRICSCountry, lat: -25.720, lng: 28.397,  densityBase:  9_800 },
];

const CATEGORIES: ComplaintCategory[] = [
  "Water Supply",
  "Roads",
  "Digital Connectivity",
  "Sanitation",
  "Energy",
];

const START_MS = new Date("2025-01-01").getTime();
const END_MS   = new Date("2025-06-30").getTime();

function generateMockData() {
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

  const complaints: ComplaintPoint[] = Array.from({ length: 500 }, (_, i) => {
    const city     = CITIES[i % CITIES.length];
    const category = pick(CATEGORIES);
    const volume   = Math.round(randRange(10, 1500));
    const deficit  = Math.round(randRange(10, 95));
    const density  = Math.round(city.densityBase * randRange(0.4, 1.6));
    const ts       = new Date(START_MS + rand() * (END_MS - START_MS)).toISOString();
    const conf     = parseFloat(randRange(0.55, 0.99).toFixed(2));

    const lat = city.lat + randRange(-0.04, 0.04);
    const lng = city.lng + randRange(-0.04, 0.04);

    const severity_score = parseFloat(
      (0.35 * (deficit / 100) + 0.35 * Math.min(volume / 1000, 1) + 0.30 * Math.min(density / 20_000, 1)).toFixed(3)
    );

    return {
      id: `complaint-${i + 1}`,
      lat,
      lng,
      category,
      severity_score,
      complaint_volume: volume,
      infra_deficit: deficit,
      population_density: density,
      timestamp: ts,
      confidence_score: conf,
      region: city.city,
      country: city.country,
    };
  });

  const investments: InvestmentZone[] = [
    {
      id: "inv-jhb-water",
      name: "Joburg Inner City Water Main Upgrade",
      region: "Johannesburg",
      budget_usd: 2_500_000,
      category: "Water Supply",
      coordinates: [
        [[28.02, -26.19], [28.07, -26.19], [28.07, -26.22], [28.02, -26.22], [28.02, -26.19]],
      ],
      year: 2025,
      country: "South Africa",
    },
    {
      id: "inv-sandton-fibre",
      name: "Sandton High-Speed Fibre Ring",
      region: "Sandton",
      budget_usd: 8_500_000,
      category: "Digital Connectivity",
      coordinates: [
        [[28.03, -26.09], [28.08, -26.09], [28.08, -26.13], [28.03, -26.13], [28.03, -26.09]],
      ],
      year: 2025,
      country: "South Africa",
    },
  ];

  return { complaints, investments };
}

export const { complaints: MOCK_COMPLAINTS, investments: MOCK_INVESTMENTS } = generateMockData();
