/**
 * src/hooks/useAICopilot.ts
 * Phase 4 & 8 — AI Copilot Hook
 *
 * Provides AI Copilot capabilities to any component:
 * - Quick access to orchestrator functions
 * - Segmentation trigger
 * - Campaign generation
 * - Dashboard insights
 */

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useAI } from "./useAI";
import { processUserMessage, runAutonomousSellCycle, gerarInsightsDashboard } from "@/services/ai.orchestrator";
import { segmentarClientesAutomaticamente, getSegmentationSummary, type ClientSegment } from "@/services/ai-segmentation.service";
import { generateAndSaveCampaign, type GenerateCampaignParams } from "@/services/ai-campaign.service";
import { getAIServiceStatus, clearAICache } from "@/services/ai.service";
import type { OrchestratorResponse } from "@/services/ai.orchestrator";

export interface UseAICopilotReturn {
  // Status
  isConfigured: boolean;
  isProcessing: boolean;

  // Actions
  askCopilot: (message: string) => Promise<OrchestratorResponse | null>;
  segmentClients: () => Promise<{ success: boolean; message: string }>;
  createAICampaign: (params: Partial<GenerateCampaignParams>) => Promise<{ success: boolean; message: string }>;
  runAutoSell: () => Promise<{ campaignsCreated: number; clientsTargeted: number }>;
  getInsights: () => Promise<{ suggestaoIA: string; clientesEmRisco: number; campanhasRecomendadas: string[] }>;
  getSegments: () => Promise<Record<ClientSegment, number> | null>;
  clearCache: () => void;

  // Status info
  serviceStatus: ReturnType<typeof getAIServiceStatus>;
}

export function useAICopilot(): UseAICopilotReturn {
  const { organization, user } = useAuth();
  const { churnSignals } = useAI();
  const [isProcessing, setIsProcessing] = useState(false);

  const orgId = organization?.id || "";
  const userId = user?.id || "";

  const askCopilot = useCallback(async (message: string): Promise<OrchestratorResponse | null> => {
    if (!orgId || !userId) return null;
    setIsProcessing(true);
    try {
      return await processUserMessage(message, {
        organizationId: orgId,
        userId,
        churnSignals,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [orgId, userId, churnSignals]);

  const segmentClients = useCallback(async () => {
    if (!orgId) return { success: false, message: "Sem organização" };
    setIsProcessing(true);
    try {
      const { data, error } = await segmentarClientesAutomaticamente(orgId);
      if (error) return { success: false, message: error };
      return {
        success: true,
        message: `${data?.totalClients} clientes segmentados. Tags: ${data?.tagsApplied}`,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [orgId]);

  const createAICampaign = useCallback(async (params: Partial<GenerateCampaignParams>) => {
    if (!orgId) return { success: false, message: "Sem organização" };
    setIsProcessing(true);
    try {
      const { data, error } = await generateAndSaveCampaign({
        segmento: params.segmento || "ativos",
        objetivo: params.objetivo || "engajamento",
        platform: params.platform,
        organizationId: orgId,
      });
      if (error) return { success: false, message: error };
      return { success: true, message: `Campanha "${data?.name}" criada!` };
    } finally {
      setIsProcessing(false);
    }
  }, [orgId]);

  const runAutoSell = useCallback(async () => {
    if (!orgId) return { campaignsCreated: 0, clientsTargeted: 0 };
    setIsProcessing(true);
    try {
      return await runAutonomousSellCycle(orgId);
    } finally {
      setIsProcessing(false);
    }
  }, [orgId]);

  const getInsights = useCallback(async () => {
    if (!orgId) return { suggestaoIA: "", clientesEmRisco: 0, campanhasRecomendadas: [] };
    return await gerarInsightsDashboard(orgId);
  }, [orgId]);

  const getSegments = useCallback(async () => {
    if (!orgId) return null;
    const { data } = await getSegmentationSummary(orgId);
    return data;
  }, [orgId]);

  return {
    isConfigured: getAIServiceStatus().configured,
    isProcessing,
    askCopilot,
    segmentClients,
    createAICampaign,
    runAutoSell,
    getInsights,
    getSegments,
    clearCache: clearAICache,
    serviceStatus: getAIServiceStatus(),
  };
}
