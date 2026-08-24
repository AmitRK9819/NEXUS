"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useStore } from "@/lib/store";
import { mockXAIEvidence, mockChartData } from "@/lib/mock-data";
import CategoryBadge from "@/components/CategoryBadge";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import ConfidenceBar from "@/components/ConfidenceBar";
import XAIModal from "@/components/XAIModal";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  MapPin,
  CalendarClock,
  DollarSign,
  Target,
  ArrowLeft,
  FileText,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RecommendationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getRecommendation } = useStore();
  const rec = getRecommendation(id);
  const [xaiOpen, setXaiOpen] = useState(false);

  if (!rec) return notFound();

  const evidence = mockXAIEvidence[id];
  const chartData = mockChartData[id];

  // Chart axis labels by category
  const chartConfig: Record<string, { yLabel: string; actualLabel: string; capacityLabel: string }> = {
    "rec-001": { yLabel: "Occupancy (%)", actualLabel: "ICU Occupancy %", capacityLabel: "Safe Threshold (100%)" },
    "rec-002": { yLabel: "PCI Score", actualLabel: "Pavement Condition Index", capacityLabel: "Minimum Acceptable (70)" },
    "rec-003": { yLabel: "TDS (ppm)", actualLabel: "Water TDS Level", capacityLabel: "BIS Limit (500 ppm)" },
    "rec-004": { yLabel: "Penetration (%)", actualLabel: "Internet Penetration %", capacityLabel: "State Average (58%)" },
  };
  const cc = chartConfig[id] ?? { yLabel: "Value", actualLabel: "Actual", capacityLabel: "Threshold" };

  return (
    <>
      {/* AI Disclosure */}
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>AI-generated content</strong> — review and human verification required before action or approval.
        </p>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Action toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="flex gap-2">
            {evidence && (
              <button
                onClick={() => setXaiOpen(true)}
                type="button"
                className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
                aria-haspopup="dialog"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Why was this recommended?
              </button>
            )}
            <Link
              href={`/proposals/${id}`}
              className="flex items-center gap-1.5 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Draft Project Proposal Brief
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Summary Panel */}
          <section
            aria-labelledby="rec-summary-heading"
            className="lg:col-span-1 space-y-4"
          >
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <CategoryBadge category={rec.category} />
                <PriorityBadge priority={rec.priority} />
              </div>
              <h1
                id="rec-summary-heading"
                className="text-base font-bold leading-snug text-slate-900"
              >
                {rec.title}
              </h1>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-700">{rec.location}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-700">
                    Action required within <strong>{rec.urgencyDays} days</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-700">
                    Estimated Cost: <strong>{rec.estimatedCost}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-700">{rec.targetOutcome}</span>
                </div>
              </div>

              <div className="mt-4">
                <ConfidenceBar value={rec.confidence} />
              </div>

              <div className="mt-4">
                <StatusBadge status={rec.status} size="md" />
              </div>
            </div>

            {/* Summary text */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Situation Overview
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">{rec.summary}</p>
            </div>

            {/* Key Metrics snapshot */}
            {evidence && (
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">
                  Key Indicators
                </h2>
                <dl className="space-y-2">
                  {evidence.keyMetrics.slice(0, 4).map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                      <dt className="text-xs text-slate-500">{m.label}</dt>
                      <dd className={`text-xs font-semibold ${m.critical ? "text-red-700" : "text-slate-900"}`}>
                        {m.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          {/* Chart Panel */}
          <section
            aria-labelledby="rec-chart-heading"
            className="lg:col-span-2 space-y-4"
          >
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2
                id="rec-chart-heading"
                className="mb-1 text-sm font-semibold text-slate-900"
              >
                6-Month Historical Trend vs. Threshold
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                Visual evidence supporting this recommendation
              </p>

              {chartData ? (
                <div aria-label="Line chart showing historical trend data" role="img">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: cc.yLabel,
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 10, fill: "#94a3b8" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <ReferenceLine
                        y={chartData[0]?.capacity}
                        stroke="#ef4444"
                        strokeDasharray="6 3"
                        label={{
                          value: cc.capacityLabel,
                          position: "right",
                          style: { fontSize: 10, fill: "#ef4444" },
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name={cc.actualLabel}
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#0f172a" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        name="Projected (Model)"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded bg-slate-50 text-sm text-slate-400">
                  Chart data not available
                </div>
              )}
            </div>

            {/* Impact & Data Sources */}
            {evidence && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">
                    Predicted Impact
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {evidence.impactSummary}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                  <h2 className="mb-2 text-sm font-semibold text-amber-900">
                    Key Limitations
                  </h2>
                  <ul className="space-y-1.5" role="list">
                    {evidence.limitations.slice(0, 3).map((lim, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {lim}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* XAI Modal */}
      {xaiOpen && evidence && (
        <XAIModal
          recommendation={rec}
          evidence={evidence}
          onClose={() => setXaiOpen(false)}
        />
      )}
    </>
  );
}
