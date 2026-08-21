"use client";

import { useState } from "react";
import Link from "next/link";
import type { Recommendation } from "@/types/governance";
import { mockXAIEvidence } from "@/lib/mock-data";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBar from "./ConfidenceBar";
import XAIModal from "./XAIModal";
import {
  MapPin,
  DollarSign,
  TrendingUp,
  CalendarClock,
  HelpCircle,
  Eye,
  FileText,
} from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({
  recommendation: rec,
}: RecommendationCardProps) {
  const [xaiOpen, setXaiOpen] = useState(false);
  const evidence = mockXAIEvidence[rec.id];

  return (
    <>
      <article
        className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        aria-label={`Recommendation: ${rec.title}`}
      >
        {/* Card header */}
        <div className="border-b border-slate-100 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={rec.category} />
            <PriorityBadge priority={rec.priority} />
            <StatusBadge status={rec.status} />
          </div>
          <h2 className="text-sm font-semibold leading-snug text-slate-900">
            {rec.title}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{rec.location}</span>
          </div>
        </div>

        {/* Card body */}
        <div className="flex-1 p-4 space-y-3">
          <ConfidenceBar value={rec.confidence} />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-slate-50 p-2">
              <div className="mb-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                Est. Cost
              </div>
              <p className="text-xs font-semibold text-slate-900">{rec.estimatedCost}</p>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <div className="mb-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                Impact
              </div>
              <p className="text-xs font-semibold text-slate-900 leading-tight">{rec.predictedImpact.length > 40 ? rec.predictedImpact.slice(0, 40) + "…" : rec.predictedImpact}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Action required within <strong className="text-slate-900">{rec.urgencyDays} days</strong></span>
          </div>

          <div className="rounded border border-slate-100 bg-slate-50 p-2.5">
            <p className="text-[11px] text-slate-500">Current Metric</p>
            <p className="text-xs font-medium text-slate-800">{rec.currentMetric}</p>
          </div>
        </div>

        {/* Card actions */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setXaiOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900"
            aria-haspopup="dialog"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Why was this recommended?
          </button>
          <div className="flex gap-2">
            <Link
              href={`/recommendations/${rec.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-slate-800 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View Details
            </Link>
            <Link
              href={`/proposals/${rec.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Draft Proposal
            </Link>
          </div>
        </div>
      </article>

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
