// ============================================================
// NEXUS — Governance Type Definitions
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

export interface Recommendation {
  id: string;
  title: string;
  category: RecommendationCategory;
  location: string;
  priority: RecommendationPriority;
  confidence: number;
  estimatedCost: string;
  currentMetric: string;
  predictedImpact: string;
  status: RecommendationStatus;
  timestamp: string;
  summary: string;
  targetOutcome: string;
  urgencyDays: number;
}

export interface XAIFactor {
  rank: number;
  variable: string;
  weight: number;
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

export interface ChartDataPoint {
  month: string;
  actual: number;
  capacity: number;
  projected?: number;
}

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

export interface DecisionRecord {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  category: RecommendationCategory;
  decision: DecisionType;
  reviewer: string;
  timestamp: string;
  notes: string;
  originalConfidence: number;
  xaiSnapshot?: XAIEvidence;
  proposalSnapshot?: ProposalBrief;
}

export interface AppState {
  recommendations: Recommendation[];
  decisions: DecisionRecord[];
  proposals: Record<string, ProposalBrief>;
}
