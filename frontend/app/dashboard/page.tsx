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

type SortKey = "date" | "priority" | "cost" | "days";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function parseCost(cost: string): number {
  const match = cost.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export default function DashboardPage() {
  const { state } = useStore();
  const recs = state.recommendations;

  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [priorityFilters, setPriorityFilters] = useState<Set<RecommendationPriority>>(new Set());
  const [priorityOpen, setPriorityOpen] = useState(false);

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
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>AI Sovereign Decision Support</strong> — dual-metric synthesis across citizen demand and public budget allocations. All interventions require policymaker verification.
        </p>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Policy Intelligence & Interventions</h1>
            <p className="mt-1 text-xs text-slate-600">Review AI-prioritized infrastructure interventions based on PostGIS deficit hotspots and budget misalignments.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <section aria-labelledby="kpi-section-heading" className="mb-8">
          <h2 id="kpi-section-heading" className="sr-only">Key Performance Indicators</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KPICard title="Total Recommendations" value={kpis.total} icon={LayoutList} highlight="default" />
            <KPICard title="Pending Review" value={kpis.pending} icon={Clock} highlight={kpis.pending > 0 ? "amber" : "default"} subtitle="Requires signature" />
            <KPICard title="Approved" value={kpis.approved} icon={CheckCircle2} highlight="emerald" />
            <KPICard title="Changes / Rejected" value={kpis.changesOrRejected} icon={XCircle} highlight="default" />
            <KPICard title="Avg. AI Confidence" value={`${kpis.avgConfidence}%`} icon={Brain} highlight="blue" subtitle="Across all sectors" />
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <section aria-labelledby="search-filter-heading" className="mb-6">
          <h2 id="search-filter-heading" className="sr-only">Search and Filter</h2>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-300 focus-within:bg-white transition-colors">
                <Search className="ml-3 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  id="rec-search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by title, location, category, or evidence…"
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  aria-label="Search recommendations"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setAppliedQuery(""); }}
                    className="mr-1 rounded p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex-shrink-0 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Priority dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setPriorityOpen((o) => !o); setSortOpen(false); }}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors select-none whitespace-nowrap",
                    priorityFilters.size > 0
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Priority
                  {priorityFilters.size > 0 && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold text-white leading-none">
                      {priorityFilters.size}
                    </span>
                  )}
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${priorityOpen ? "rotate-180" : ""}`} />
                </button>

                {priorityOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPriorityOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as RecommendationPriority[]).map((p) => {
                        const checked = priorityFilters.has(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePriority(p)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <span
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {checked && "✓"}
                            </span>
                            <span className="font-medium">{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setSortOpen((o) => !o); setPriorityOpen(false); }}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 select-none whitespace-nowrap"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  Sort: {activeSortLabel}
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>

                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                      {SORT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = sortKey === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => toggleSort(opt.key, opt.defaultDir)}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs ${
                              isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="flex-1 text-left">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Recommendation Feed */}
        <section aria-labelledby="rec-section-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="rec-section-heading" className="text-sm font-semibold text-slate-900">
              Active Strategic Interventions ({filteredRecs.length})
            </h2>
          </div>

          {filteredRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-600">No recommendations match your filters.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
