"use client";

import { useEffect, useRef, useState } from "react";
import type { DecisionType } from "@/types/governance";
import { X, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface DecisionModalProps {
  type: DecisionType;
  recommendationTitle: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

const config: Record<
  DecisionType,
  {
    title: string;
    description: string;
    icon: React.ElementType;
    buttonLabel: string;
    buttonClass: string;
    placeholder: string;
    required: boolean;
  }
> = {
  APPROVED: {
    title: "Approve Project",
    description:
      "You are approving this recommendation for implementation. This action will be permanently logged with your identity and timestamp.",
    icon: CheckCircle2,
    buttonLabel: "Confirm Approval",
    buttonClass: "bg-emerald-700 hover:bg-emerald-800 text-white",
    placeholder: "Optional: Add any notes or conditions for approval…",
    required: false,
  },
  REJECTED: {
    title: "Reject Recommendation",
    description:
      "You are rejecting this recommendation. A mandatory justification is required for the audit record.",
    icon: XCircle,
    buttonLabel: "Confirm Rejection",
    buttonClass: "bg-red-700 hover:bg-red-800 text-white",
    placeholder: "Required: State your justification for rejection…",
    required: true,
  },
  "CHANGES REQUESTED": {
    title: "Request Changes",
    description:
      "You are requesting revisions before this recommendation can be approved. Specify the required changes clearly.",
    icon: RefreshCw,
    buttonLabel: "Submit Change Request",
    buttonClass: "bg-orange-600 hover:bg-orange-700 text-white",
    placeholder: "Required: Describe the specific changes needed…",
    required: true,
  },
};

export default function DecisionModal({
  type,
  recommendationTitle,
  onConfirm,
  onCancel,
}: DecisionModalProps) {
  const { title, description, icon: Icon, buttonLabel, buttonClass, placeholder, required } =
    config[type];

  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();
    const prevFocus = document.activeElement as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [onCancel]);

  function handleSubmit() {
    if (required && !notes.trim()) {
      setError("This field is required before proceeding.");
      return;
    }
    onConfirm(notes.trim());
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        aria-describedby="decision-modal-desc"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-slate-700" aria-hidden="true" />
            <h2
              id="decision-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              {title}
            </h2>
          </div>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            type="button"
            aria-label="Cancel and close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p id="decision-modal-desc" className="text-sm text-slate-600">
            {description}
          </p>

          <div className="rounded bg-slate-50 p-3 text-sm text-slate-700 border border-slate-200">
            <span className="font-medium">Recommendation: </span>
            {recommendationTitle}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="decision-notes"
              className="block text-sm font-medium text-slate-900"
            >
              {required ? (
                <>
                  Notes / Justification{" "}
                  <span className="text-red-600" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </>
              ) : (
                "Notes (optional)"
              )}
            </label>
            <textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError("");
              }}
              placeholder={placeholder}
              rows={4}
              aria-required={required}
              aria-describedby={error ? "decision-notes-error" : undefined}
              className={`w-full rounded border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 ${
                error ? "border-red-400" : "border-slate-300"
              }`}
            />
            {error && (
              <p
                id="decision-notes-error"
                role="alert"
                className="flex items-center gap-1 text-xs text-red-600"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            This decision will be logged with reviewer identity (Sarvesh) and a
            UTC timestamp and cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`flex-1 rounded px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-slate-900 ${buttonClass}`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
