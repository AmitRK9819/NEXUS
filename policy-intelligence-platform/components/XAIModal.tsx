"use client";

import { useEffect, useRef, useCallback } from "react";
import type { XAIEvidence, Recommendation } from "@/types/governance";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  AlertCircle,
  Bot,
  BarChart3,
  ListOrdered,
  ShieldAlert,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBar from "./ConfidenceBar";

interface XAIModalProps {
  recommendation: Recommendation;
  evidence: XAIEvidence;
  onClose: () => void;
}

export default function XAIModal({
  recommendation,
  evidence,
  onClose,
}: XAIModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and Escape-to-close
  useEffect(() => {
    closeBtnRef.current?.focus();
    const previous = document.activeElement as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const TrendIcon = ({ trend }: { trend?: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" aria-hidden="true" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
    return <Minus className="h-4 w-4 text-slate-400" aria-hidden="true" />;
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="xai-modal-title"
        aria-describedby="xai-modal-desc"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="flex-1 pr-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h2
                id="xai-modal-title"
                className="text-base font-semibold text-slate-900"
              >
                Why was this recommendation made?
              </h2>
            </div>
            <p
              id="xai-modal-desc"
              className="text-sm font-medium text-slate-700"
            >
              {recommendation.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CategoryBadge category={recommendation.category} />
              <ConfidenceBar value={recommendation.confidence} showLabel={false} />
              <span className="text-xs font-semibold text-slate-700">
                {recommendation.confidence}% confidence
              </span>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            type="button"
            aria-label="Close explanation panel"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── AI Disclosure ────────────────────── */}
        <div className="ai-disclosure-banner flex items-center gap-2 px-5 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-xs font-medium text-amber-800">
            AI-generated content — review and human verification required before action or approval.
          </p>
        </div>

        {/* ── Scrollable body ──────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Key Evidence Metrics */}
          <section aria-labelledby="xai-metrics-heading">
            <h3
              id="xai-metrics-heading"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <BarChart3 className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Key Evidence & Current Indicators
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {evidence.keyMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-lg border p-3 ${
                    metric.critical
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <TrendIcon trend={metric.trend} />
                    {metric.critical && (
                      <span className="text-[10px] font-bold uppercase text-red-600">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{metric.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Influencing Factors */}
          <section aria-labelledby="xai-factors-heading">
            <h3
              id="xai-factors-heading"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <ListOrdered className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Influencing Factors (Ranked by Weight)
            </h3>
            <ol className="space-y-2">
              {evidence.influencingFactors.map((factor) => (
                <li key={factor.rank} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                    {factor.rank}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900">
                        {factor.variable}
                      </p>
                      <div className="ml-4 flex items-center gap-1.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-slate-700"
                            style={{ width: `${factor.weight}%` }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">
                          {factor.weight}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{factor.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Impact & Confidence */}
          <section aria-labelledby="xai-impact-heading">
            <h3
              id="xai-impact-heading"
              className="mb-3 text-sm font-semibold text-slate-900"
            >
              Predicted Impact & Confidence Rationale
            </h3>
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-700">Predicted Impact</p>
                <p className="text-sm text-slate-800">{evidence.impactSummary}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold text-blue-800">Confidence Score Justification</p>
                <p className="text-sm text-blue-900">{evidence.confidenceRationale}</p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section aria-labelledby="xai-sources-heading">
            <h3
              id="xai-sources-heading"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <Database className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Ingested Data Sources
            </h3>
            <ul className="space-y-1.5" role="list">
              {evidence.dataSources.map((src, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-700"
                >
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  {src}
                </li>
              ))}
            </ul>
          </section>

          {/* Limitations */}
          <section aria-labelledby="xai-limits-heading">
            <h3
              id="xai-limits-heading"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Limitations & Caveats
            </h3>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <ul className="space-y-2" role="list">
                {evidence.limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* ── Footer ──────────────────────────── */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            type="button"
            className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
