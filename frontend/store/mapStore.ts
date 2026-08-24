import { create } from "zustand";
import type { ComplaintCategory, BRICSCountry, ComplaintPoint, InvestmentZone } from "@/types/map";

const ALL_CATEGORIES: ComplaintCategory[] = [
  "Water Supply",
  "Roads",
  "Digital Connectivity",
  "Sanitation",
  "Energy",
];

const ALL_COUNTRIES: BRICSCountry[] = [
  "India", "Brazil", "Russia", "China", "South Africa",
];

const DEFAULT_TIME_START = new Date("2025-01-01").getTime();
const DEFAULT_TIME_END   = new Date("2026-12-31").getTime();

interface MapState {
  complaints: ComplaintPoint[];
  investments: InvestmentZone[];
  isLoading: boolean;
  error: string | null;

  selectedCategories: ComplaintCategory[];
  selectedCountries: BRICSCountry[];
  timeRange: [number, number];
  minSeverity: number;

  selectedHotspotId: string | null;
  hoveredHotspotId: string | null;
  showInvestmentLayer: boolean;
  showHeatmap: boolean;
  showClusters: boolean;

  setComplaints: (data: ComplaintPoint[]) => void;
  setInvestments: (data: InvestmentZone[]) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;

  toggleCategory: (cat: ComplaintCategory) => void;
  setAllCategories: () => void;
  clearCategories: () => void;
  toggleCountry: (c: BRICSCountry) => void;
  setTimeRange: (range: [number, number]) => void;
  setMinSeverity: (v: number) => void;

  selectHotspot: (id: string | null) => void;
  hoverHotspot: (id: string | null) => void;
  toggleInvestmentLayer: () => void;
  toggleHeatmap: () => void;
  toggleClusters: () => void;

  filteredComplaints: () => ComplaintPoint[];
}

export const useMapStore = create<MapState>((set, get) => ({
  complaints: [],
  investments: [],
  isLoading: false,
  error: null,

  selectedCategories: [...ALL_CATEGORIES],
  selectedCountries: [...ALL_COUNTRIES],
  timeRange: [DEFAULT_TIME_START, DEFAULT_TIME_END],
  minSeverity: 0,

  selectedHotspotId: null,
  hoveredHotspotId: null,
  showInvestmentLayer: true,
  showHeatmap: true,
  showClusters: true,

  setComplaints: (data) => set({ complaints: data }),
  setInvestments: (data) => set({ investments: data }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),

  toggleCategory: (cat) =>
    set((s) => ({
      selectedCategories: s.selectedCategories.includes(cat)
        ? s.selectedCategories.filter((c) => c !== cat)
        : [...s.selectedCategories, cat],
    })),
  setAllCategories: () => set({ selectedCategories: [...ALL_CATEGORIES] }),
  clearCategories: () => set({ selectedCategories: [] }),

  toggleCountry: (country) =>
    set((s) => ({
      selectedCountries: s.selectedCountries.includes(country)
        ? s.selectedCountries.filter((c) => c !== country)
        : [...s.selectedCountries, country],
    })),

  setTimeRange: (range) => set({ timeRange: range }),
  setMinSeverity: (v) => set({ minSeverity: v }),

  selectHotspot: (id) => set({ selectedHotspotId: id }),
  hoverHotspot: (id) => set({ hoveredHotspotId: id }),
  toggleInvestmentLayer: () => set((s) => ({ showInvestmentLayer: !s.showInvestmentLayer })),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
  toggleClusters: () => set((s) => ({ showClusters: !s.showClusters })),

  filteredComplaints: () => {
    const { complaints, selectedCategories, selectedCountries, timeRange, minSeverity } = get();
    const [tStart, tEnd] = timeRange;
    return complaints.filter((p) => {
      if (!selectedCategories.includes(p.category)) return false;
      if (!selectedCountries.includes(p.country)) return false;
      const t = new Date(p.timestamp).getTime();
      if (t < tStart || t > tEnd) return false;
      if (p.severity_score < minSeverity) return false;
      return true;
    });
  },
}));
