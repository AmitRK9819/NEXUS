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

function ExpandedRow({ record }: { record: DecisionRecord }) {
  return (
    <tr>
      <td colSpan={6} className="bg-slate-50 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Decision Notes */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Decision Notes
            </h3>
            <p className="text-sm text-slate-800">
              {record.notes || <em className="text-slate-400">No notes provided.</em>}
            </p>
          </div>

          {/* AI Evidence Snapshot */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              Original AI Data
            </h3>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-blue-600">Confidence Score</dt>
                <dd className="font-semibold text-blue-900">{record.originalConfidence}%</dd>
              </div>
            </dl>
            {record.xaiSnapshot && (
              <p className="mt-2 text-xs text-blue-700">
                Impact: {record.xaiSnapshot.impactSummary.slice(0, 100)}…
              </p>
            )}
          </div>

          {/* Proposal Snapshot */}
          {record.proposalSnapshot && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Proposal Snapshot
              </h3>
              <p className="text-xs font-medium text-slate-800">
                {record.proposalSnapshot.title}
              </p>
              <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                {record.proposalSnapshot.executiveSummary}
              </p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
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
      {/* AI Disclosure */}
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>Audit Log</strong> — this record is immutable and represents the complete human decision trail for all AI-assisted recommendations.
        </p>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <History className="h-5 w-5" aria-hidden="true" />
              Decision History & Audit Log
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Complete record of all policymaker decisions on AI-assisted recommendations.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Back to Dashboard
          </Link>
        </div>

        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
            <History className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No decisions recorded yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Approve, reject, or request changes on a recommendation to create an audit record.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="gov-table w-full border-collapse text-sm"
                aria-label="Decision history audit log"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recommendation
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Decision
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date & Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((record) => {
                    const isExpanded = expanded.has(record.id);
                    const { date, time } = formatDateTime(record.timestamp);
                    return (
                      <>
                        <tr
                          key={record.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {record.recommendationTitle}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <CategoryBadge category={record.category} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${decisionStyles[record.decision]}`}
                            >
                              <DecisionIcon decision={record.decision} />
                              {record.decision}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                              <span>
                                <span className="font-medium text-slate-900">{date}</span>
                                <br />
                                <span>{time}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs">
                              <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                              <span className="font-medium text-slate-900">{record.reviewer}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleExpand(record.id)}
                              aria-expanded={isExpanded}
                              aria-controls={`expand-${record.id}`}
                              className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> Inspect
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr key={`${record.id}-expanded`} id={`expand-${record.id}`}>
                            <td colSpan={6} className="bg-slate-50 px-6 py-5">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                    Decision Notes
                                  </h3>
                                  <p className="text-sm text-slate-800">
                                    {record.notes || (
                                      <em className="text-slate-400">No notes provided.</em>
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                                    Original AI Data
                                  </h3>
                                  <dl className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <dt className="text-blue-600">Confidence Score</dt>
                                      <dd className="font-semibold text-blue-900">
                                        {record.originalConfidence}%
                                      </dd>
                                    </div>
                                  </dl>
                                </div>

                                {record.proposalSnapshot && (
                                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                      Proposal Snapshot
                                    </h3>
                                    <p className="text-xs font-medium text-slate-800">
                                      {record.proposalSnapshot.title}
                                    </p>
                                    <p className="mt-1 line-clamp-3 text-xs text-slate-600">
                                      {record.proposalSnapshot.executiveSummary}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {decisions.length} decision{decisions.length !== 1 ? "s" : ""} recorded •
              All timestamps are in local time • Reviewer: Sarvesh (Policymaker)
            </div>
          </div>
        )}
      </div>
    </>
  );
}
