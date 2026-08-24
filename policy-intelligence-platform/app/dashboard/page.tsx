"use client";

import { useMemo, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import KPICard from "@/components/KPICard";
import RecommendationCard from "@/components/RecommendationCard";
import type { Recommendation, RecommendationPriority } from "@/types/governance";
import {
  LayoutList,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  AlertCircle,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  CalendarDays,
  AlertTriangle,
  Banknote,
  Timer,
  ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
type SortKey = "date" | "priority" | "cost" | "days";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Parse "₹4.2 Crore" → 4.2, "₹12.7 Crore" → 12.7 (in Crore units)
function parseCost(cost: string): number {
  const match = cost.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// ─── Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const { state } = useStore();
  const recs = state.recommendations;

  // ── Search ──────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  // ── Priority filters ────────────────────────────────────
  const [priorityFilters, setPriorityFilters] = useState<Set<RecommendationPriority>>(new Set());
  const [priorityOpen, setPriorityOpen] = useState(false);

  // ── Sort ────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType; defaultDir: SortDir }[] = [
    { key: "date",     label: "Date",           icon: CalendarDays,  defaultDir: "desc" },
    { key: "priority", label: "Critical / High", icon: AlertTriangle, defaultDir: "desc" },
    { key: "cost",     label: "Est. Cost",       icon: Banknote,      defaultDir: "desc" },
    { key: "days",     label: "Est. Days",       icon: Timer,         defaultDir: "asc"  },
  ];

  const handleSearch = useCallback(() => {
    setAppliedQuery(query.trim());
    setPriorityOpen(false);
    setSortOpen(false);
  }, [query]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const toggleSort = useCallback(
    (key: SortKey, defaultDir: SortDir) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir(defaultDir);
      }
      setSortOpen(false);
    },
    [sortKey]
  );

  const togglePriority = useCallback((p: RecommendationPriority) => {
    setPriorityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setAppliedQuery("");
    setPriorityFilters(new Set());
    setSortKey("date");
    setSortDir("desc");
    setPriorityOpen(false);
    setSortOpen(false);
  }, []);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort by";
  const hasActiveFilters = appliedQuery !== "" || priorityFilters.size > 0;

  // ── KPIs ─────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = recs.length;
    const pending = recs.filter(
      (r) => r.status === "PENDING REVIEW" || r.status === "UNDER REVIEW"
    ).length;
    const approved = recs.filter((r) => r.status === "APPROVED").length;
    const changesOrRejected = recs.filter(
      (r) => r.status === "CHANGES REQUESTED" || r.status === "REJECTED"
    ).length;
    const avgConfidence = Math.round(
      recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length
    );
    return { total, pending, approved, changesOrRejected, avgConfidence };
  }, [recs]);

  // ── Filtered + Sorted ────────────────────────────────────
  const filteredRecs = useMemo<Recommendation[]>(() => {
    const q = appliedQuery.toLowerCase();

    let result = recs.filter((r) => {
      const matchesSearch =
        q === "" ||
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.currentMetric.toLowerCase().includes(q) ||
        r.predictedImpact.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q);
      const matchesPriority =
        priorityFilters.size === 0 || priorityFilters.has(r.priority);
      return matchesSearch && matchesPriority;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date")     cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortKey === "priority") cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortKey === "cost")     cmp = parseCost(a.estimatedCost) - parseCost(b.estimatedCost);
      if (sortKey === "days")     cmp = a.urgencyDays - b.urgencyDays;
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [recs, appliedQuery, priorityFilters, sortKey, sortDir]);

  return (
    <>
      {/* AI Disclosure Banner */}
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>AI-generated content</strong> — review and human verification required before action or approval. All decisions require authorised policymaker sign-off.
        </p>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Policymaker Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Review AI-generated recommendations and take action. All decisions are logged and auditable.</p>
        </div>

        {/* KPI Cards */}
        <section aria-labelledby="kpi-section-heading" className="mb-8">
          <h2 id="kpi-section-heading" className="sr-only">Key Performance Indicators</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KPICard label="Total Recommendations" value={kpis.total} icon={LayoutList} highlight="neutral" />
            <KPICard label="Pending Review" value={kpis.pending} icon={Clock} highlight={kpis.pending > 5 ? "critical" : "warning"} description="Require policymaker action" />
            <KPICard label="Approved" value={kpis.approved} icon={CheckCircle2} highlight="positive" />
            <KPICard label="Changes / Rejected" value={kpis.changesOrRejected} icon={XCircle} highlight="warning" />
            <KPICard label="Avg. AI Confidence" value={`${kpis.avgConfidence}%`} icon={Brain} highlight="neutral" description="Across all recommendations" />
          </div>
        </section>

        {/* ── Search & Filter Toolbar ─────────────────────────── */}
        <section aria-labelledby="search-filter-heading" className="mb-6">
          <h2 id="search-filter-heading" className="sr-only">Search and Filter</h2>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">

              {/* Search input + Search button */}
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-300 focus-within:bg-white transition-colors">
                <Search className="ml-3 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  id="rec-search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search with title, location, category…"
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  aria-label="Search recommendations"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setAppliedQuery(""); }}
                    className="mr-1 rounded p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  id="search-submit-btn"
                  onClick={handleSearch}
                  className="flex-shrink-0 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
                >
                  Search
                </button>
              </div>

              {/* Filter by Priority dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="priority-filter-btn"
                  onClick={() => { setPriorityOpen((o) => !o); setSortOpen(false); }}
                  aria-expanded={priorityOpen}
                  aria-haspopup="listbox"
                  className={[
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors select-none whitespace-nowrap",
                    priorityFilters.size > 0
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filter by priority
                  {priorityFilters.size > 0 && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                      {priorityFilters.size}
                    </span>
                  )}
                  <ChevronDown
                    className={["h-4 w-4 text-slate-400 transition-transform duration-200", priorityOpen ? "rotate-180" : ""].join(" ")}
                    aria-hidden="true"
                  />
                </button>

                {priorityOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPriorityOpen(false)} aria-hidden="true" />
                    <div
                      role="listbox"
                      aria-multiselectable="true"
                      aria-label="Filter by priority"
                      className="absolute left-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
                    >
                      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as RecommendationPriority[]).map((p) => {
                        const checked = priorityFilters.has(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            role="option"
                            aria-selected={checked}
                            onClick={() => togglePriority(p)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span
                              className={[
                                "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                                checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white",
                              ].join(" ")}
                              aria-hidden="true"
                            >
                              {checked && (
                                <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
                                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className="font-medium">{p}</span>
                          </button>
                        );
                      })}
                      {priorityFilters.size > 0 && (
                        <div className="mt-1 border-t border-slate-100 px-4 pb-1.5 pt-2">
                          <button
                            type="button"
                            onClick={() => { setPriorityFilters(new Set()); setPriorityOpen(false); }}
                            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Clear selection
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Sort by dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="sort-dropdown-btn"
                  onClick={() => { setSortOpen((o) => !o); setPriorityOpen(false); }}
                  aria-expanded={sortOpen}
                  aria-haspopup="listbox"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors select-none whitespace-nowrap"
                >
                  <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  Sort: {activeSortLabel}
                  <ChevronDown
                    className={["h-4 w-4 text-slate-400 transition-transform duration-200", sortOpen ? "rotate-180" : ""].join(" ")}
                    aria-hidden="true"
                  />
                </button>

                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} aria-hidden="true" />
                    <div
                      role="listbox"
                      aria-label="Sort options"
                      className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
                    >
                      {SORT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = sortKey === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onClick={() => toggleSort(opt.key, opt.defaultDir)}
                            className={[
                              "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="flex-1 text-left">{opt.label}</span>
                            {isActive && (
                              <ChevronDown
                                className={["h-3.5 w-3.5 text-indigo-500 transition-transform duration-200", sortDir === "asc" ? "rotate-180" : ""].join(" ")}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Clear all */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                  aria-label="Clear all filters"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
              )}

            </div>
          </div>
        </section>

        {/* ── Recommendation Feed ───────────────────────────── */}
        <section aria-labelledby="rec-section-heading">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 id="rec-section-heading" className="text-base font-semibold text-slate-900">
              Active Recommendations
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {filteredRecs.length} of {recs.length}
            </span>
            {hasActiveFilters && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Filters active
              </span>
            )}
          </div>

          {filteredRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-600">No recommendations match your search.</p>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or removing some filters.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {filteredRecs.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
