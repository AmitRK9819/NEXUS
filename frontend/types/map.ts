// ============================================================
// NEXUS — Geospatial Map TypeScript Interfaces
// ============================================================

export type BRICSCountry = "India" | "Brazil" | "Russia" | "China" | "South Africa";

export type ComplaintCategory =
  | "Water Supply"
  | "Roads"
  | "Digital Connectivity"
  | "Sanitation"
  | "Energy";

export type SeverityLevel = "low" | "moderate" | "high" | "critical";

export interface ComplaintPoint {
  id: string;
  lat: number;
  lng: number;
  category: ComplaintCategory;
  severity_score: number;
  complaint_volume: number;
  infra_deficit: number;
  population_density: number;
  timestamp: string;
  confidence_score: number;
  region: string;
  country: BRICSCountry;
}

export interface InvestmentZone {
  id: string;
  name: string;
  region: string;
  budget_usd: number;
  category: string;
  coordinates: [number, number][][];
  year: number;
  country: BRICSCountry;
}

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

export interface MapFilters {
  categories: ComplaintCategory[];
  timeRange: [number, number];
  countries: BRICSCountry[];
  minSeverity: number;
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  generated_at: string;
}
