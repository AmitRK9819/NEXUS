// ============================================================
// NEXUS — Shared TypeScript Interfaces (Member 3: Mapper)
// ============================================================

export type BRICSCountry = "India" | "Brazil" | "Russia" | "China" | "South Africa";

export type ComplaintCategory =
  | "Water Supply"
  | "Roads"
  | "Digital Connectivity"
  | "Sanitation"
  | "Energy";

export type SeverityLevel = "low" | "moderate" | "high" | "critical";

// ----------------------------------------------------------
// Raw complaint point as returned by Member 2's API
// ----------------------------------------------------------
export interface ComplaintPoint {
  id: string;
  lat: number;
  lng: number;
  category: ComplaintCategory;
  /** Pre-computed severity score from backend (0–1) */
  severity_score: number;
  /** Raw complaint count feeding into this point */
  complaint_volume: number;
  /** Infrastructure deficit index (0–100, higher = worse) */
  infra_deficit: number;
  /** Population density in persons/km² */
  population_density: number;
  /** ISO 8601 timestamp of the complaint */
  timestamp: string;
  /** AI confidence in classification (0–1) */
  confidence_score: number;
  region: string;
  country: BRICSCountry;
}

// ----------------------------------------------------------
// Government investment zone (GeoJSON polygon + metadata)
// ----------------------------------------------------------
export interface InvestmentZone {
  id: string;
  name: string;
  region: string;
  budget_usd: number;
  category: string;
  /** GeoJSON polygon coordinates */
  coordinates: [number, number][][];
  year: number;
  country: BRICSCountry;
}

// ----------------------------------------------------------
// Derived hotspot (aggregated from complaint points)
// ----------------------------------------------------------
export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  region: string;
  country: BRICSCountry;
  severity_score: number;
  severity_level: SeverityLevel;
  total_complaints: number;
  dominant_category: ComplaintCategory;
  category_breakdown: Record<ComplaintCategory, number>;
  avg_infra_deficit: number;
  avg_population_density: number;
  has_investment_overlap: boolean;
  investment_gap_usd: number;
}

// ----------------------------------------------------------
// Filter state used across the app
// ----------------------------------------------------------
export interface MapFilters {
  categories: ComplaintCategory[];
  /** Unix timestamps for the active time window */
  timeRange: [number, number];
  countries: BRICSCountry[];
  minSeverity: number; // 0–1
}

// ----------------------------------------------------------
// API response wrappers
// ----------------------------------------------------------
export interface ApiResponse<T> {
  data: T;
  total: number;
  generated_at: string;
}
