// ============================================================
// NEXUS — Unit Tests: Mock Data Integrity
// ============================================================

import {
  MOCK_COMPLAINTS,
  MOCK_INVESTMENTS,
  filterByCategory,
  filterByTimeRange,
  getTopHotspots,
} from "../mock-data";
import type { ComplaintCategory } from "../types";

// ---- T-R-01 ------------------------------------------------
describe("MOCK_COMPLAINTS dataset", () => {
  it("T-R-01: contains exactly 500 points", () => {
    expect(MOCK_COMPLAINTS).toHaveLength(500);
  });

  it("all points have valid lat/lng", () => {
    MOCK_COMPLAINTS.forEach((p) => {
      expect(p.lat).toBeGreaterThan(-90);
      expect(p.lat).toBeLessThan(90);
      expect(p.lng).toBeGreaterThan(-180);
      expect(p.lng).toBeLessThan(180);
    });
  });

  it("all severity_scores are in [0, 1]", () => {
    MOCK_COMPLAINTS.forEach((p) => {
      expect(p.severity_score).toBeGreaterThanOrEqual(0);
      expect(p.severity_score).toBeLessThanOrEqual(1);
    });
  });

  it("all timestamps are valid ISO 8601 strings within Jan–Jun 2025", () => {
    const start = new Date("2025-01-01").getTime();
    const end   = new Date("2025-06-30").getTime();
    MOCK_COMPLAINTS.forEach((p) => {
      const t = new Date(p.timestamp).getTime();
      expect(t).toBeGreaterThanOrEqual(start);
      expect(t).toBeLessThanOrEqual(end);
    });
  });

  it("all points have unique IDs", () => {
    const ids = new Set(MOCK_COMPLAINTS.map((p) => p.id));
    expect(ids.size).toBe(500);
  });

  it("covers all 5 BRICS countries", () => {
    const countries = new Set(MOCK_COMPLAINTS.map((p) => p.country));
    expect(countries.has("India")).toBe(true);
    expect(countries.has("Brazil")).toBe(true);
    expect(countries.has("Russia")).toBe(true);
    expect(countries.has("China")).toBe(true);
    expect(countries.has("South Africa")).toBe(true);
  });

  it("covers all 5 categories", () => {
    const cats = new Set(MOCK_COMPLAINTS.map((p) => p.category));
    (["Water Supply","Roads","Digital Connectivity","Sanitation","Energy"] as ComplaintCategory[])
      .forEach((c) => expect(cats.has(c)).toBe(true));
  });
});

// ---- T-R-03 ------------------------------------------------
describe("MOCK_INVESTMENTS dataset", () => {
  it("T-R-03: contains 5 investment zones", () => {
    expect(MOCK_INVESTMENTS).toHaveLength(5);
  });

  it("each zone has valid polygon coordinates", () => {
    MOCK_INVESTMENTS.forEach((inv) => {
      expect(Array.isArray(inv.coordinates)).toBe(true);
      expect(inv.coordinates[0].length).toBeGreaterThanOrEqual(4); // polygon is closed
    });
  });

  it("all budgets are positive", () => {
    MOCK_INVESTMENTS.forEach((inv) => {
      expect(inv.budget_usd).toBeGreaterThan(0);
    });
  });
});

// ---- T-F-01 ------------------------------------------------
describe("filterByCategory", () => {
  it("T-F-01: single category filter returns only matching points", () => {
    const filtered = filterByCategory(MOCK_COMPLAINTS, ["Roads"]);
    expect(filtered.every((p) => p.category === "Roads")).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(MOCK_COMPLAINTS.length);
  });

  it("T-F-03: empty categories → zero results", () => {
    const filtered = filterByCategory(MOCK_COMPLAINTS, []);
    expect(filtered).toHaveLength(0);
  });

  it("T-F-02: all categories → same as full dataset", () => {
    const filtered = filterByCategory(
      MOCK_COMPLAINTS,
      ["Water Supply","Roads","Digital Connectivity","Sanitation","Energy"]
    );
    expect(filtered).toHaveLength(MOCK_COMPLAINTS.length);
  });
});

// ---- T-F-04 / T-F-05 ----------------------------------------
describe("filterByTimeRange", () => {
  const JAN_START = new Date("2025-01-01").getTime();
  const JAN_END   = new Date("2025-01-31").getTime();
  const FULL_END  = new Date("2025-06-30").getTime();

  it("T-F-04: narrow window returns subset", () => {
    const filtered = filterByTimeRange(MOCK_COMPLAINTS, JAN_START, JAN_END);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(MOCK_COMPLAINTS.length);
  });

  it("T-F-05: full range returns all 500 points", () => {
    const filtered = filterByTimeRange(MOCK_COMPLAINTS, JAN_START, FULL_END);
    expect(filtered).toHaveLength(MOCK_COMPLAINTS.length);
  });
});

// ---- getTopHotspots -----------------------------------------
describe("getTopHotspots", () => {
  it("returns top N by severity score in descending order", () => {
    const top = getTopHotspots(MOCK_COMPLAINTS, 5);
    expect(top).toHaveLength(5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].severity_score).toBeGreaterThanOrEqual(top[i].severity_score);
    }
  });
});
