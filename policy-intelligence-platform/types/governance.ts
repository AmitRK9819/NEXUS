// ============================================================
// Policy Intelligence Platform — Governance Type Definitions
// ============================================================

export type RecommendationCategory =
  | "Healthcare"
  | "Transport"
  | "Water Supply"
  | "Digital Infrastructure"
  | "Energy"
  | "Education";

export type RecommendationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RecommendationStatus =
  | "PENDING REVIEW"
  | "UNDER REVIEW"
  | "CHANGES REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type DecisionType = "APPROVED" | "REJECTED" | "CHANGES REQUESTED";

// ─── Core Entities ──────────────────────────────────────────

export interface Recommendation {
  id: string;
  title: string;
  category: RecommendationCategory;
  location: string;
  priority: RecommendationPriority;
  /** 0–100 */
  confidence: number;
  estimatedCost: string;
  /** Human-readable current metric, e.g. "ICU Occupancy: 92%" */
  currentMetric: string;
  predictedImpact: string;
  status: RecommendationStatus;
  timestamp: string; // ISO 8601
  summary: string;
  targetOutcome: string;
  urgencyDays: number;
}

// ─── XAI Evidence ───────────────────────────────────────────

export interface XAIFactor {
  rank: number;
  variable: string;
  weight: number; // 0–100
  description: string;
}

export interface XAIKeyMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  critical?: boolean;
}

export interface XAIEvidence {
  recommendationId: string;
  keyMetrics: XAIKeyMetric[];
  influencingFactors: XAIFactor[];
  impactSummary: string;
  confidenceRationale: string;
  dataSources: string[];
  limitations: string[];
}

// ─── Chart Data ─────────────────────────────────────────────

export interface ChartDataPoint {
  month: string;
  actual: number;
  capacity: number;
  projected?: number;
}

// ─── Proposal Brief ─────────────────────────────────────────

export interface TimelinePhase {
  phase: string;
  duration: string;
  activities: string;
}

export interface RiskItem {
  risk: string;
  mitigation: string;
}

export interface ProposalBrief {
  title: string;
  executiveSummary: string;
  problemStatement: string;
  intervention: string;
  expectedImpact: string;
  budget: string;
  resources: string;
  timeline: TimelinePhase[];
  risks: RiskItem[];
  successMetrics: string[];
}

// ─── Decision Record ────────────────────────────────────────

export interface DecisionRecord {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  category: RecommendationCategory;
  decision: DecisionType;
  reviewer: string;
  timestamp: string; // ISO 8601
  notes: string;
  originalConfidence: number;
  xaiSnapshot?: XAIEvidence;
  proposalSnapshot?: ProposalBrief;
}

// ─── App State ──────────────────────────────────────────────

export interface AppState {
  recommendations: Recommendation[];
  decisions: DecisionRecord[];
  proposals: Record<string, ProposalBrief>;
}
