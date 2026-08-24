"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AppState,
  Recommendation,
  RecommendationStatus,
  DecisionRecord,
  ProposalBrief,
  DecisionType,
} from "@/types/governance";
import {
  mockRecommendations,
  mockDecisionRecords,
} from "@/lib/mock-data";

interface StoreContextValue {
  state: AppState;
  updateStatus: (id: string, status: RecommendationStatus) => void;
  saveProposal: (recommendationId: string, proposal: ProposalBrief) => void;
  recordDecision: (record: Omit<DecisionRecord, "id">) => void;
  getProposal: (recommendationId: string) => ProposalBrief | undefined;
  getRecommendation: (id: string) => Recommendation | undefined;
  getDecisionsForRecommendation: (recommendationId: string) => DecisionRecord[];
}

const StoreContext = createContext<StoreContextValue | null>(null);
const STORAGE_KEY = "nexus_unified_app_state_v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    recommendations: mockRecommendations,
    decisions: mockDecisionRecords,
    proposals: {},
  }));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppState>;
        setState((prev) => ({
          recommendations: parsed.recommendations ?? prev.recommendations,
          decisions: parsed.decisions ?? prev.decisions,
          proposals: parsed.proposals ?? prev.proposals,
        }));
      }
    } catch {
      // Storage fallback
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const updateStatus = useCallback(
    (id: string, status: RecommendationStatus) => {
      setState((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === id ? { ...r, status } : r
        ),
      }));
    },
    []
  );

  const saveProposal = useCallback(
    (recommendationId: string, proposal: ProposalBrief) => {
      setState((prev) => ({
        ...prev,
        proposals: { ...prev.proposals, [recommendationId]: proposal },
      }));
    },
    []
  );

  const recordDecision = useCallback(
    (record: Omit<DecisionRecord, "id">) => {
      const id = `dec-${Date.now()}`;
      const newRecord: DecisionRecord = { ...record, id };

      const statusMap: Record<DecisionType, RecommendationStatus> = {
        APPROVED: "APPROVED",
        REJECTED: "REJECTED",
        "CHANGES REQUESTED": "CHANGES REQUESTED",
      };

      setState((prev) => ({
        ...prev,
        decisions: [newRecord, ...prev.decisions],
        recommendations: prev.recommendations.map((r) =>
          r.id === record.recommendationId
            ? { ...r, status: statusMap[record.decision] }
            : r
        ),
      }));
    },
    []
  );

  const getProposal = useCallback(
    (recommendationId: string) => state.proposals[recommendationId],
    [state.proposals]
  );

  const getRecommendation = useCallback(
    (id: string) => state.recommendations.find((r) => r.id === id),
    [state.recommendations]
  );

  const getDecisionsForRecommendation = useCallback(
    (recommendationId: string) =>
      state.decisions.filter((d) => d.recommendationId === recommendationId),
    [state.decisions]
  );

  return (
    <StoreContext.Provider
      value={{
        state,
        updateStatus,
        saveProposal,
        recordDecision,
        getProposal,
        getRecommendation,
        getDecisionsForRecommendation,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
