"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  MessageSquare,
  Send,
  CheckCircle,
  ShieldCheck,
  Smartphone,
  Radio,
  FileAudio,
  MapPin,
  Scale,
  ExternalLink,
} from "lucide-react";

export default function IntakePage() {
  const [phoneNumber, setPhoneNumber] = useState("+27 82 555 0199");
  const [channel, setChannel] = useState("whatsapp");
  const [textBody, setTextBody] = useState("Water pipeline burst on Vilakazi Street in Soweto, flooding the road for 4 days.");
  const [sampleAudio, setSampleAudio] = useState("water_leak_soweto.wav");
  const [isVoice, setIsVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("phone_number", phoneNumber);
      formData.append("channel", channel);
      if (isVoice) {
        formData.append("media_url", sampleAudio);
      } else {
        formData.append("text_body", textBody);
      }

      const res = await fetch("http://localhost:8000/api/v1/intake/message", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert(`Submission failed: ${(err as Error).message}. Ensure backend is running on port 8000.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
            <Mic className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Citizen Grievance & Multimodal Intake Simulator
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Test real-time multilingual STT (Whisper/Bhashini), DPDP pseudonymous hashing, NER geocoding, and VADER sentiment structuring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-slate-500" />
            Simulate Citizen Input Channel
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Citizen Phone Number (automatically hashed for DPDP compliance):
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Channel:</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="ussd">USSD</option>
                  <option value="web">Web Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Input Format:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVoice(false)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium border ${
                      !isVoice ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVoice(true)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium border ${
                      isVoice ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Voice
                  </button>
                </div>
              </div>
            </div>

            {isVoice ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Sample Audio File:</label>
                <select
                  value={sampleAudio}
                  onChange={(e) => setSampleAudio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                >
                  <option value="water_leak_soweto.wav">water_leak_soweto.wav (Hindi/Zulu voice sample)</option>
                  <option value="road_pothole_sector4.wav">road_pothole_sector4.wav (Roads voice sample)</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Transcribed and translated using speech-to-text model.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Grievance Description (Multilingual):</label>
                <textarea
                  rows={4}
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Describe civic issue (e.g. Pani ki pipe phat gayi hai ward 14 mein)..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-cyan-700 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? "Processing through AI Pipelines…" : "Submit & Ingest to PostGIS"}
            </button>
          </form>
        </div>

        {/* Result Breakdown Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Structuring & DPDP Gating Output
          </h2>

          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center justify-between gap-2 text-emerald-800 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Processed & Geolocated Successfully!</span>
                </div>
                <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  DPDP Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block">Intent Category:</span>
                  <span className="font-bold text-slate-900 text-sm capitalize">{result.intent_category?.replace(/_/g, " ")}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block">NLP Confidence:</span>
                  <span className="font-bold text-slate-900 text-sm">{Math.round((result.intent_confidence || 0.85) * 100)}%</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block">Sentiment Polarity:</span>
                  <span className="font-bold text-slate-900 text-sm">{result.sentiment_score}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block">Extracted Location:</span>
                  <span className="font-bold text-slate-900 text-sm">{result.location?.landmark || "Gauteng Sector"}</span>
                </div>
              </div>

              {/* Direct Next Action Integration */}
              <div className="flex gap-2 pt-2">
                <Link
                  href="/map"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  View on Spatial Map
                </Link>
                <Link
                  href="/triage"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5 text-indigo-600" />
                  Inspect in Triage
                </Link>
              </div>

              <div className="rounded-lg bg-slate-900 p-3 text-slate-200 font-mono text-[11px] overflow-x-auto">
                <p className="text-slate-400 font-bold mb-1">// Structured Data Contract</p>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-lg p-6">
              <Radio className="h-8 w-8 mb-2 text-slate-300 animate-pulse" />
              <p className="text-xs font-medium text-slate-500">Awaiting submission…</p>
              <p className="text-[11px] text-slate-400 mt-1">Submit a grievance above to see live speech-to-text transcription, geocoding, and sentiment analysis pipeline output.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
