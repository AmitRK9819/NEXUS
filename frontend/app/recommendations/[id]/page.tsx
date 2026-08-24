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

  const chartConfig: Record<string, { yLabel: string; actualLabel: string; capacityLabel: string }> = {
    "rec-001": { yLabel: "Occupancy (%)", actualLabel: "ICU Occupancy %", capacityLabel: "Safe Threshold (100%)" },
    "rec-002": { yLabel: "PCI Score", actualLabel: "Pavement Condition Index", capacityLabel: "Minimum Acceptable (70)" },
    "rec-003": { yLabel: "TDS (ppm)", actualLabel: "Water TDS Level", capacityLabel: "BIS Limit (500 ppm)" },
    "rec-004": { yLabel: "Penetration (%)", actualLabel: "Internet Penetration %", capacityLabel: "State Average (58%)" },
  };
  const cc = chartConfig[id] ?? { yLabel: "Value", actualLabel: "Actual", capacityLabel: "Threshold" };

  return (
    <>
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>Explainable Evidence</strong> — multi-source indicators, 6-month historical trend curves, and risk factors.
        </p>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="flex gap-2">
            {evidence && (
              <button
                onClick={() => setXaiOpen(true)}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Why was this recommended?
              </button>
            )}
            <Link
              href={`/proposals/${id}`}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Draft Project Proposal Brief
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <CategoryBadge category={rec.category} />
                <PriorityBadge priority={rec.priority} />
              </div>
              <h1 className="text-base font-bold leading-snug text-slate-900">
                {rec.title}
              </h1>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="text-slate-700">{rec.location}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="text-slate-700">
                    Action required within <strong>{rec.urgencyDays} days</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <DollarSign className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="text-slate-700">
                    Estimated Cost: <strong>{rec.estimatedCost}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="text-slate-700">{rec.targetOutcome}</span>
                </div>
              </div>

              <div className="mt-4">
                <ConfidenceBar score={rec.confidence} />
              </div>

              <div className="mt-4">
                <StatusBadge status={rec.status} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                Situation Overview
              </h2>
              <p className="text-xs leading-relaxed text-slate-600">{rec.summary}</p>
            </div>
          </section>

          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-slate-900">
                6-Month Historical Trend vs. Threshold
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                Visual trend analysis validating the necessity of intervention
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
                <div className="flex h-40 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">
                  Chart data not available
                </div>
              )}
            </div>

            {evidence && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Predicted Impact
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {evidence.impactSummary}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
                    Key Limitations
                  </h2>
                  <ul className="space-y-1.5" role="list">
                    {evidence.limitations.slice(0, 3).map((lim, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
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
