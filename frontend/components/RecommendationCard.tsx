import Link from "next/link";
import {
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
} from "lucide-react";
import type { Recommendation } from "@/types/governance";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBar from "./ConfidenceBar";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onOpenXAI?: (rec: Recommendation) => void;
  onOpenDecision?: (rec: Recommendation) => void;
}

export default function RecommendationCard({
  recommendation,
  onOpenXAI,
  onOpenDecision,
}: RecommendationCardProps) {
  const isPending =
    recommendation.status === "PENDING REVIEW" ||
    recommendation.status === "UNDER REVIEW";

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
      aria-labelledby={`rec-title-${recommendation.id}`}
    >
      {/* Header row: category, priority, status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={recommendation.category} />
          <PriorityBadge priority={recommendation.priority} />
        </div>
        <StatusBadge status={recommendation.status} />
      </div>

      {/* Title */}
      <h3
        id={`rec-title-${recommendation.id}`}
        className="mt-3 text-base font-semibold leading-snug text-slate-900"
      >
        <Link
          href={`/recommendations/${recommendation.id}`}
          className="hover:text-blue-700 focus-visible:underline"
        >
          {recommendation.title}
        </Link>
      </h3>

      {/* Location */}
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <span className="truncate">{recommendation.location}</span>
      </div>

      {/* Summary */}
      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
        {recommendation.summary}
      </p>

      {/* Metric chips */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
        <div>
          <span className="block font-medium text-slate-500">Current State</span>
          <span className="font-semibold text-slate-800">
            {recommendation.currentMetric}
          </span>
        </div>
        <div>
          <span className="block font-medium text-slate-500">Target Impact</span>
          <span className="font-semibold text-slate-800">
            {recommendation.predictedImpact}
          </span>
        </div>
      </div>

      {/* Confidence Score Bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            AI Confidence
          </span>
        </div>
        <ConfidenceBar score={recommendation.confidence} size="sm" />
      </div>

      {/* Meta: Cost & Urgency */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <span>
          Est. Cost: <strong className="text-slate-800">{recommendation.estimatedCost}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
          {recommendation.urgencyDays}d SLA
        </span>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        {onOpenXAI && (
          <button
            type="button"
            onClick={() => onOpenXAI(recommendation)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Explain
          </button>
        )}

        <Link
          href={`/proposals/${recommendation.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          Brief
        </Link>

        {isPending && onOpenDecision ? (
          <button
            type="button"
            onClick={() => onOpenDecision(recommendation)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Review
          </button>
        ) : (
          <Link
            href={`/recommendations/${recommendation.id}`}
            className="flex items-center justify-center rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            aria-label={`View details for ${recommendation.title}`}
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
