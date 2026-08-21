"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import KPICard from "@/components/KPICard";
import RecommendationCard from "@/components/RecommendationCard";
import {
  LayoutList,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { state } = useStore();
  const recs = state.recommendations;

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

  return (
    <>
      {/* AI Disclosure Banner */}
      <div
        className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>AI-generated content</strong> — review and human verification
          required before action or approval. All decisions require authorised
          policymaker sign-off.
        </p>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Policymaker Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review AI-generated recommendations and take action. All decisions
            are logged and auditable.
          </p>
        </div>

        {/* KPI Cards */}
        <section aria-labelledby="kpi-section-heading" className="mb-8">
          <h2 id="kpi-section-heading" className="sr-only">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KPICard
              label="Total Recommendations"
              value={kpis.total}
              icon={LayoutList}
              highlight="neutral"
            />
            <KPICard
              label="Pending Review"
              value={kpis.pending}
              icon={Clock}
              highlight={kpis.pending > 5 ? "critical" : "warning"}
              description="Require policymaker action"
            />
            <KPICard
              label="Approved"
              value={kpis.approved}
              icon={CheckCircle2}
              highlight="positive"
            />
            <KPICard
              label="Changes / Rejected"
              value={kpis.changesOrRejected}
              icon={XCircle}
              highlight="warning"
            />
            <KPICard
              label="Avg. AI Confidence"
              value={`${kpis.avgConfidence}%`}
              icon={Brain}
              highlight="neutral"
              description="Across all recommendations"
            />
          </div>
        </section>

        {/* Recommendation Feed */}
        <section aria-labelledby="rec-section-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="rec-section-heading"
              className="text-base font-semibold text-slate-900"
            >
              Active Recommendations
            </h2>
            <p className="text-xs text-slate-500">
              {recs.length} recommendation{recs.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {recs.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
