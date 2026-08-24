"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { ProposalBrief, DecisionType, TimelinePhase, RiskItem } from "@/types/governance";
import CategoryBadge from "@/components/CategoryBadge";
import StatusBadge from "@/components/StatusBadge";
import ConfidenceBar from "@/components/ConfidenceBar";
import DecisionModal from "@/components/DecisionModal";
import {
  ArrowLeft,
  Bot,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

type SectionKey = keyof Omit<ProposalBrief, "timeline" | "risks" | "successMetrics">;

const SECTION_LABELS: Record<SectionKey, string> = {
  title: "1. Project Title",
  executiveSummary: "2. Executive Summary",
  problemStatement: "3. Problem Statement",
  intervention: "4. Proposed Intervention",
  expectedImpact: "5. Expected Impact",
  budget: "6. Estimated Budget",
  resources: "7. Required Resources",
};

export default function ProposalPage({ params }: PageProps) {
  const { id } = use(params);
  const { getRecommendation, getProposal, saveProposal, recordDecision, updateStatus } = useStore();
  const router = useRouter();

  const rec = getRecommendation(id);
  const [proposal, setProposal] = useState<ProposalBrief | null>(() => getProposal(id) ?? null);
  const [generating, setGenerating] = useState(false);
  const [genSource, setGenSource] = useState<"gemini" | "mock" | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<DecisionType | null>(null);
  const [saved, setSaved] = useState(false);

  // Auto-generate if no proposal exists
  useEffect(() => {
    if (!proposal && rec && !generating) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!rec) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation: rec }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json() as { proposal: ProposalBrief; source: "gemini" | "mock" };
      setProposal(data.proposal);
      setGenSource(data.source);
      saveProposal(id, data.proposal);
    } catch (e) {
      setGenError("Failed to generate proposal. Please try again.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }, [rec, id, saveProposal]);

  const updateField = useCallback(
    (key: SectionKey, value: string) => {
      setProposal((prev) => prev ? { ...prev, [key]: value } : prev);
    },
    []
  );

  const updateTimeline = useCallback((index: number, field: keyof TimelinePhase, value: string) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const updated = prev.timeline.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      );
      return { ...prev, timeline: updated };
    });
  }, []);

  const addTimelinePhase = useCallback(() => {
    setProposal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        timeline: [
          ...prev.timeline,
          { phase: "New Phase", duration: "Weeks TBD", activities: "Describe activities…" },
        ],
      };
    });
  }, []);

  const removeTimelinePhase = useCallback((index: number) => {
    setProposal((prev) => {
      if (!prev) return prev;
      return { ...prev, timeline: prev.timeline.filter((_, i) => i !== index) };
    });
  }, []);

  const updateRisk = useCallback((index: number, field: keyof RiskItem, value: string) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const updated = prev.risks.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      );
      return { ...prev, risks: updated };
    });
  }, []);

  const addRisk = useCallback(() => {
    setProposal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        risks: [...prev.risks, { risk: "New Risk", mitigation: "Mitigation strategy…" }],
      };
    });
  }, []);

  const removeRisk = useCallback((index: number) => {
    setProposal((prev) => {
      if (!prev) return prev;
      return { ...prev, risks: prev.risks.filter((_, i) => i !== index) };
    });
  }, []);

  const updateMetric = useCallback((index: number, value: string) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const updated = prev.successMetrics.map((m, i) => (i === index ? value : m));
      return { ...prev, successMetrics: updated };
    });
  }, []);

  const addMetric = useCallback(() => {
    setProposal((prev) => {
      if (!prev) return prev;
      return { ...prev, successMetrics: [...prev.successMetrics, "New success metric…"] };
    });
  }, []);

  const removeMetric = useCallback((index: number) => {
    setProposal((prev) => {
      if (!prev) return prev;
      return { ...prev, successMetrics: prev.successMetrics.filter((_, i) => i !== index) };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (proposal) {
      saveProposal(id, proposal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [proposal, id, saveProposal]);

  const handleDecisionConfirm = useCallback(
    (type: DecisionType, notes: string) => {
      if (!rec || !proposal) return;
      recordDecision({
        recommendationId: id,
        recommendationTitle: rec.title,
        category: rec.category,
        decision: type,
        reviewer: "Sarvesh",
        timestamp: new Date().toISOString(),
        notes,
        originalConfidence: rec.confidence,
        proposalSnapshot: proposal,
      });
      saveProposal(id, proposal);
      setDecisionModal(null);
      router.push("/history");
    },
    [rec, proposal, id, recordDecision, saveProposal, router]
  );

  if (!rec) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 text-center">
        <p className="text-slate-600">Recommendation not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-slate-900 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* AI Disclosure */}
      <div className="ai-disclosure-banner flex items-center gap-2 px-4 py-2.5 sm:px-6" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-800">
          <strong>AI-generated content</strong> — all sections are editable. Review thoroughly and apply professional judgement before making a decision.
        </p>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/recommendations/${id}`}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Details
          </Link>
          {proposal && (
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-slate-900 ${
                saved
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {saved ? (
                <><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Saved</>
              ) : (
                <><Save className="h-3.5 w-3.5" aria-hidden="true" /> Save Edits</>
              )}
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar — Rec Summary */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <CategoryBadge category={rec.category} />
              </div>
              <h1 className="text-sm font-semibold text-slate-900">{rec.title}</h1>
              <p className="mt-1.5 text-xs text-slate-500">{rec.location}</p>
              <div className="mt-3">
                <ConfidenceBar value={rec.confidence} />
              </div>
              <div className="mt-2">
                <StatusBadge status={rec.status} />
              </div>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Est. Cost</dt>
                  <dd className="font-medium text-slate-900">{rec.estimatedCost}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Urgency</dt>
                  <dd className="font-medium text-slate-900">{rec.urgencyDays} days</dd>
                </div>
              </dl>
            </div>

            {/* Generation info */}
            {genSource && (
              <div className={`rounded-lg border p-3 text-xs ${genSource === "gemini" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span className="font-medium text-slate-700">
                    {genSource === "gemini" ? "Generated by Gemini AI" : "Generated by structured template"}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">All sections are editable. Changes are saved locally.</p>
              </div>
            )}

            {/* Decision controls */}
            {proposal && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Policymaker Decision
                </h2>
                <button
                  type="button"
                  onClick={() => setDecisionModal("APPROVED")}
                  className="flex w-full items-center justify-center gap-2 rounded bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve Project
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionModal("CHANGES REQUESTED")}
                  className="flex w-full items-center justify-center gap-2 rounded border border-orange-400 bg-orange-50 px-3 py-2.5 text-xs font-semibold text-orange-800 hover:bg-orange-100 focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionModal("REJECTED")}
                  className="flex w-full items-center justify-center gap-2 rounded border border-red-300 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject Recommendation
                </button>
              </div>
            )}

            {/* Re-generate */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Generating…</>
              ) : (
                <><Bot className="h-3.5 w-3.5" aria-hidden="true" /> Re-generate Proposal</>
              )}
            </button>
          </aside>

          {/* Editor — Main */}
          <main className="lg:col-span-3">
            {generating && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-700">Generating proposal brief…</p>
                <p className="mt-1 text-xs text-slate-400">
                  {process.env.NEXT_PUBLIC_GEMINI_AVAILABLE === "true"
                    ? "Calling Gemini AI…"
                    : "Applying structured template…"}
                </p>
              </div>
            )}

            {genError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="mb-1 h-4 w-4" aria-hidden="true" />
                {genError}
              </div>
            )}

            {proposal && !generating && (
              <div className="space-y-5">
                {/* Text sections */}
                {(Object.entries(SECTION_LABELS) as [SectionKey, string][]).map(
                  ([key, label]) => (
                    <section
                      key={key}
                      aria-labelledby={`section-${key}`}
                      className="rounded-lg border border-slate-200 bg-white p-5"
                    >
                      <label
                        id={`section-${key}`}
                        htmlFor={`field-${key}`}
                        className="mb-2 block text-sm font-semibold text-slate-900"
                      >
                        {label}
                      </label>
                      {key === "title" ? (
                        <input
                          id={`field-${key}`}
                          type="text"
                          value={proposal[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
                        />
                      ) : (
                        <textarea
                          id={`field-${key}`}
                          value={proposal[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          rows={key === "executiveSummary" ? 4 : 3}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm leading-relaxed text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
                        />
                      )}
                    </section>
                  )
                )}

                {/* Timeline */}
                <section
                  aria-labelledby="section-timeline"
                  className="rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="section-timeline" className="text-sm font-semibold text-slate-900">
                      8. Implementation Timeline (Phased)
                    </h2>
                    <button
                      type="button"
                      onClick={addTimelinePhase}
                      className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Phase
                    </button>
                  </div>
                  <div className="space-y-4">
                    {proposal.timeline.map((phase, i) => (
                      <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                          <input
                            aria-label={`Phase ${i + 1} name`}
                            type="text"
                            value={phase.phase}
                            onChange={(e) => updateTimeline(i, "phase", e.target.value)}
                            className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
                          />
                          <input
                            aria-label={`Phase ${i + 1} duration`}
                            type="text"
                            value={phase.duration}
                            onChange={(e) => updateTimeline(i, "duration", e.target.value)}
                            className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-900"
                          />
                          <button
                            type="button"
                            aria-label={`Remove phase ${i + 1}`}
                            onClick={() => removeTimelinePhase(i)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <textarea
                          aria-label={`Phase ${i + 1} activities`}
                          value={phase.activities}
                          onChange={(e) => updateTimeline(i, "activities", e.target.value)}
                          rows={2}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Risks */}
                <section
                  aria-labelledby="section-risks"
                  className="rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="section-risks" className="text-sm font-semibold text-slate-900">
                      9. Identified Risks & Mitigation
                    </h2>
                    <button
                      type="button"
                      onClick={addRisk}
                      className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Risk
                    </button>
                  </div>
                  <div className="space-y-3">
                    {proposal.risks.map((risk, i) => (
                      <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Risk {i + 1}</span>
                          <button
                            type="button"
                            aria-label={`Remove risk ${i + 1}`}
                            onClick={() => removeRisk(i)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                              Risk
                            </label>
                            <textarea
                              aria-label={`Risk ${i + 1} description`}
                              value={risk.risk}
                              onChange={(e) => updateRisk(i, "risk", e.target.value)}
                              rows={2}
                              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                              Mitigation
                            </label>
                            <textarea
                              aria-label={`Risk ${i + 1} mitigation`}
                              value={risk.mitigation}
                              onChange={(e) => updateRisk(i, "mitigation", e.target.value)}
                              rows={2}
                              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Success Metrics */}
                <section
                  aria-labelledby="section-metrics"
                  className="rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="section-metrics" className="text-sm font-semibold text-slate-900">
                      10. Measurable Success Metrics
                    </h2>
                    <button
                      type="button"
                      onClick={addMetric}
                      className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Metric
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {proposal.successMetrics.map((metric, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          aria-label={`Success metric ${i + 1}`}
                          value={metric}
                          onChange={(e) => updateMetric(i, e.target.value)}
                          className="flex-1 rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
                        />
                        <button
                          type="button"
                          aria-label={`Remove metric ${i + 1}`}
                          onClick={() => removeMetric(i)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Decision Modals */}
      {decisionModal && rec && (
        <DecisionModal
          type={decisionModal}
          recommendationTitle={rec.title}
          onConfirm={(notes) => handleDecisionConfirm(decisionModal, notes)}
          onCancel={() => setDecisionModal(null)}
        />
      )}
    </>
  );
}
