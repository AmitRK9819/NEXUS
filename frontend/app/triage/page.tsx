"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchOversightQueue, approveOversightItem } from "@/lib/api";
import {
  Scale,
  CheckCircle,
  XCircle,
  Flag,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface OversightItem {
  id: string;
  raw_text: string;
  translated_text?: string;
  confidence_score?: number;
  flag_reason?: string;
  category?: string;
}

export default function TriagePage() {
  const [items, setItems] = useState<OversightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOversightQueue();
      setItems(data);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load oversight queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED" | "FLAGGED") {
    setProcessingId(id);
    try {
      await approveOversightItem(id, status);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      alert(`Action failed: ${(e as Error).message}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Scale className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Human-in-the-Loop Governance & Triage Queue
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Citizen requests and AI insights with confidence scores below the <strong>85% sovereign threshold</strong> are automatically quarantined here for human verification.
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {/* Overview Metric Banner */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Quarantined Records</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Automated Gating Rule</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">Confidence &lt; 85% or Low Geocode</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">DPDP Compliance</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">✓ Pseudonymous Hashed Ref</p>
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-xs text-slate-500">Fetching quarantined records from PostgreSQL…</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          Error: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">Governance Queue is Clear</p>
          <p className="text-xs text-slate-500 mt-1">All processed citizen grievances meet or exceed the 85% confidence threshold.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                    {item.category || "General"}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Score: {item.confidence_score ? `${Math.round(item.confidence_score * 100)}%` : "N/A"}</span>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-500 mb-1">Original Grievance:</p>
                <p className="text-sm text-slate-900 bg-slate-50 rounded-lg p-3 border border-slate-100 font-mono text-xs mb-3">
                  &ldquo;{item.raw_text}&rdquo;
                </p>

                {item.translated_text && item.translated_text !== item.raw_text && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">STT / Translated Translation:</p>
                    <p className="text-xs text-slate-700 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100">
                      {item.translated_text}
                    </p>
                  </div>
                )}

                {item.flag_reason && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 mb-4">
                    <FileText className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                    <span>Trigger: {item.flag_reason}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "APPROVED")}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "FLAGGED")}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 shadow-sm transition-colors"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Flag for Inspection
                </button>
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "REJECTED")}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
