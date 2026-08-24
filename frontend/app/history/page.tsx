"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { DecisionRecord } from "@/types/governance";
import CategoryBadge from "@/components/CategoryBadge";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  History,
  AlertCircle,
  Bot,
  FileText,
  User,
  Calendar,
} from "lucide-react";

function DecisionIcon({ decision }: { decision: DecisionRecord["decision"] }) {
  if (decision === "APPROVED")
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  if (decision === "REJECTED")
    return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
  return <RefreshCw className="h-4 w-4 text-orange-600" aria-hidden="true" />;
}

const decisionStyles: Record<DecisionRecord["decision"], string> = {
  APPROVED: "text-emerald-700 bg-emerald-50 border border-emerald-200",
  REJECTED: "text-red-700 bg-red-50 border border-red-200",
  "CHANGES REQUESTED": "text-orange-700 bg-orange-50 border border-orange-200",
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export default function HistoryPage() {
  const { state } = useStore();
  const decisions = state.decisions;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>Immutable Audit Trail</strong> — complete log of human sign-offs, evidence snapshots, and justifications.
        </p>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <History className="h-5 w-5" aria-hidden="true" />
              Decision History & Audit Trail
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Complete record of all policymaker decisions on AI-assisted sovereign infrastructure recommendations.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>

        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <History className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No decisions recorded yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Approve, reject, or request changes on a recommendation to create an audit record.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="gov-table w-full border-collapse text-xs"
                aria-label="Decision history audit log"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Recommendation
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Decision
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Date & Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Reviewer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((record) => {
                    const isExpanded = expanded.has(record.id);
                    const { date, time } = formatDateTime(record.timestamp);
                    return (
                      <tr key={record.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {record.recommendationTitle}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={record.category} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${decisionStyles[record.decision]}`}
                          >
                            <DecisionIcon decision={record.decision} />
                            {record.decision}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{date} {time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="font-medium text-slate-900">{record.reviewer}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(record.id)}
                            className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? "Hide" : "Inspect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
