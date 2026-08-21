import { NextRequest, NextResponse } from "next/server";
import type { Recommendation, ProposalBrief } from "@/types/governance";

// ─── Mock Proposal Generator ─────────────────────────────────
function generateMockProposal(rec: Recommendation): ProposalBrief {
  return {
    title: `Project Proposal: ${rec.title}`,
    executiveSummary: `This proposal authorises the implementation of targeted interventions to address the critical condition identified at ${rec.location}. Based on evidence-backed analysis with ${rec.confidence}% AI confidence, immediate action is required within ${rec.urgencyDays} days to mitigate risks and achieve the target outcome: ${rec.targetOutcome}. The estimated investment of ${rec.estimatedCost} is projected to deliver measurable public benefit: ${rec.predictedImpact}.`,
    problemStatement: `The ${rec.category} sector at ${rec.location} faces a critical operational challenge as evidenced by the current metric: ${rec.currentMetric}. Without intervention, conditions are projected to deteriorate further, with significant risk to public welfare, service delivery continuity, and fiscal efficiency. The urgency classification of ${rec.priority} demands structured response within the prescribed timeframe.`,
    intervention: `The proposed intervention encompasses: (1) Immediate technical assessment and mobilisation of requisite resources; (2) Phased implementation of infrastructure upgrades and system improvements aligned with current best practices and regulatory standards; (3) Community consultation and stakeholder engagement throughout execution; (4) Post-implementation monitoring and reporting against defined success metrics. Full compliance with applicable procurement regulations (GFR 2017) and technical standards is mandatory.`,
    expectedImpact: rec.predictedImpact + `. The intervention will directly benefit the affected population at ${rec.location}, restore service levels to prescribed standards, and generate measurable improvement in the key performance indicator: ${rec.currentMetric} → target levels as defined in the outcome framework. Secondary benefits include improved public trust in government service delivery and reduced long-term maintenance liability.`,
    budget: `Estimated Total Project Cost: ${rec.estimatedCost}\n\nBudget allocation subject to standard tendering procedures under GFR 2017. Cost estimates based on current Schedule of Rates and are valid for 90 days from proposal date. Contingency provision of 10% recommended. Funding source: State Budget / Central Sector Scheme allocation (to be confirmed by Finance Department).`,
    resources: `Human Resources: Project Management Unit (1 Project Director, 2 Engineers, 1 Finance Officer, 1 Community Liaison Officer); Technical Contractors: Empanelled vendors to be selected through competitive tender; Equipment: As per technical specifications to be developed during DPR stage; Administrative: Dedicated project office with coordination support from ${rec.category} Department.`,
    timeline: [
      {
        phase: "Phase 1 — Preparation & Procurement",
        duration: "Weeks 1–6",
        activities: "Detailed Project Report (DPR) finalisation, stakeholder consultations, tender documentation preparation, environmental and social impact pre-screening, budget appropriation confirmation.",
      },
      {
        phase: "Phase 2 — Tendering & Contract Award",
        duration: "Weeks 7–14",
        activities: "Publication of tender notice, pre-bid meeting, bid evaluation, technical scrutiny, contract negotiation and award to qualified vendor. Compliance with CVC guidelines and GFR 2017.",
      },
      {
        phase: "Phase 3 — Mobilisation & Construction",
        duration: "Weeks 15–28",
        activities: "Contractor mobilisation, site preparation, primary construction works, interim quality inspections (monthly), community impact management, progress reporting to Steering Committee.",
      },
      {
        phase: "Phase 4 — Commissioning & Handover",
        duration: "Weeks 29–34",
        activities: "System testing and commissioning, third-party technical audit, stakeholder acceptance, handover to operations team, baseline KPI measurement against success metrics.",
      },
      {
        phase: "Phase 5 — Monitoring & Evaluation",
        duration: "Months 9–18",
        activities: "Quarterly performance monitoring against success metrics, variance analysis, impact assessment report at 12 months, closure report and lessons learned documentation.",
      },
    ],
    risks: [
      {
        risk: "Procurement delays due to inadequate vendor response or bid disqualification",
        mitigation: "Pre-qualify vendors in advance; maintain reserve list of empanelled contractors; escalate to procurement committee if tender cycle exceeds 8 weeks.",
      },
      {
        risk: "Cost escalation due to material price volatility or unforeseen site conditions",
        mitigation: "Include 10% contingency in approved budget; monitor commodity price indices monthly; invoke variation clause in contract for adjustments >5% cost impact.",
      },
      {
        risk: "Community resistance or public disruption during implementation",
        mitigation: "Conduct targeted public consultation before works commence; establish grievance redressal mechanism; coordinate with local administration for traffic/access management.",
      },
      {
        risk: "Technical scope changes following detailed site investigation",
        mitigation: "Commission full site investigation before DPR finalisation; engage independent technical reviewer; maintain change control register and escalation protocol.",
      },
      {
        risk: "Monsoon season weather disruption to construction schedule",
        mitigation: "Schedule site-preparation and civil works in dry season (October–May); include schedule float of 3–4 weeks; update risk register monthly.",
      },
    ],
    successMetrics: [
      `Primary KPI: ${rec.currentMetric} reaches target levels within 6 months of project completion`,
      `Service delivery continuity: Zero disruption incidents attributable to the addressed infrastructure gap for 12 months post-completion`,
      `Cost performance: Final project cost within ±10% of approved budget estimate`,
      `Schedule performance: Practical completion achieved within approved project schedule ±4 weeks`,
      `Stakeholder satisfaction: >80% positive response in post-implementation community survey`,
      `Compliance: Zero non-compliance findings in third-party technical audit report`,
      `Impact verification: ${rec.predictedImpact} — confirmed by independent monitoring report at 12 months`,
    ],
  };
}

// ─── Gemini Proposal Generator ───────────────────────────────
async function generateGeminiProposal(rec: Recommendation): Promise<ProposalBrief> {
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const prompt = `You are a senior government project proposal writer for a GovTech platform.

Generate a structured, professional project proposal brief in valid JSON format for the following policy recommendation:

Title: ${rec.title}
Category: ${rec.category}
Location: ${rec.location}
Priority: ${rec.priority}
Estimated Cost: ${rec.estimatedCost}
Current Metric: ${rec.currentMetric}
Predicted Impact: ${rec.predictedImpact}
Target Outcome: ${rec.targetOutcome}
Urgency: ${rec.urgencyDays} days

Return ONLY a JSON object (no markdown, no preamble) with exactly these fields:
{
  "title": "string",
  "executiveSummary": "string (3-4 sentences)",
  "problemStatement": "string (2-3 sentences)",
  "intervention": "string (3-4 sentences describing the proposed action)",
  "expectedImpact": "string (2-3 sentences)",
  "budget": "string (budget breakdown narrative)",
  "resources": "string (human, technical, administrative resources)",
  "timeline": [
    {"phase": "string", "duration": "string", "activities": "string"},
    {"phase": "string", "duration": "string", "activities": "string"},
    {"phase": "string", "duration": "string", "activities": "string"},
    {"phase": "string", "duration": "string", "activities": "string"},
    {"phase": "string", "duration": "string", "activities": "string"}
  ],
  "risks": [
    {"risk": "string", "mitigation": "string"},
    {"risk": "string", "mitigation": "string"},
    {"risk": "string", "mitigation": "string"},
    {"risk": "string", "mitigation": "string"}
  ],
  "successMetrics": ["string", "string", "string", "string", "string"]
}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = response.text ?? "";
  // Strip markdown fences if present
  const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(clean) as ProposalBrief;
}

// ─── Route Handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { recommendation: Recommendation };
    const { recommendation } = body;

    if (!recommendation?.id) {
      return NextResponse.json(
        { error: "recommendation is required" },
        { status: 400 }
      );
    }

    let proposal: ProposalBrief;

    if (process.env.GEMINI_API_KEY) {
      try {
        proposal = await generateGeminiProposal(recommendation);
      } catch (geminiError) {
        console.error("Gemini API failed, falling back to mock:", geminiError);
        proposal = generateMockProposal(recommendation);
      }
    } else {
      // Offline mode: simulate a brief generation delay
      await new Promise((r) => setTimeout(r, 1500));
      proposal = generateMockProposal(recommendation);
    }

    return NextResponse.json({ proposal, source: process.env.GEMINI_API_KEY ? "gemini" : "mock" });
  } catch (error) {
    console.error("Proposal generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
