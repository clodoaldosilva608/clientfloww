/**
 * src/hooks/useAI.ts
 * Phase 7 — AI Engine Hook
 *
 * Central hook that:
 * 1. Fetches raw data (client metrics, message logs)
 * 2. Runs the engagement + churn engine
 * 3. Generates insights & recommendations
 * 4. Caches results for 5 minutes to avoid excessive re-computation
 * 5. Realtime: auto-refreshes on clients/message_logs changes
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { processClientMetrics } from "@/ai/engagement-engine";
import { analyzeBestSendWindow, analyzeChannelPerformance, generateInsights, generateRecommendations } from "@/ai/recommendation-engine";
import type { ClientMetrics, AIAnalysisResult, AIInsight, AIRecommendation, ChurnSignal } from "@/ai/types";
import type { MessageLog } from "@/types/database";

// ─── Raw Data Fetchers ────────────────────────────────────────────────────────

async function fetchClientMetrics(orgId: string): Promise<ClientMetrics[]> {
  const { data, error } = await (supabase as any)
    .from("client_metrics")
    .select("*")
    .eq("organization_id", orgId)
    .limit(500);

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    ...row,
    total_messages: Number(row.total_messages || 0),
    delivered: Number(row.delivered || 0),
    failed: Number(row.failed || 0),
    pending: Number(row.pending || 0),
    delivery_rate: Number(row.delivery_rate || 0),
    days_since_interaction: row.days_since_interaction ? Number(row.days_since_interaction) : null,
  }));
}

async function fetchMessageLogs(orgId: string): Promise<MessageLog[]> {
  const { data, error } = await supabase
    .from("message_logs")
    .select("*")
    .eq("organization_id", orgId)
    .gte("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // last 60 days
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchVipInactiveCount(orgId: string): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("get_vip_inactive_clients", {
      p_org_id: orgId,
    });
    if (error) return 0;
    return (data || []).length;
  } catch {
    return 0;
  }
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

async function runAIAnalysis(orgId: string): Promise<AIAnalysisResult> {
  const [metrics, logs, vipCount] = await Promise.all([
    fetchClientMetrics(orgId),
    fetchMessageLogs(orgId),
    fetchVipInactiveCount(orgId),
  ]);

  // 1. Engagement scoring + churn detection
  const { scores, churnSignals, avgScore } = processClientMetrics(metrics);

  // 2. Best send window
  const bestSendWindow = analyzeBestSendWindow(logs);

  // 3. Channel performance
  const channelPerf = analyzeChannelPerformance(logs);

  // 4. Insights
  const insights = generateInsights({
    churnSignals,
    scores,
    bestSendWindow,
    channelPerf,
    vipInactiveCount: vipCount,
    totalClients: metrics.length,
  });

  // 5. Recommendations
  const recommendations = generateRecommendations({
    insights,
    churnSignals,
    bestSendWindow,
    avgEngagementScore: avgScore,
  });

  const bestChannel = channelPerf[0]?.channel || "whatsapp";

  return {
    organizationId: orgId,
    generatedAt: new Date(),
    engagementScores: scores,
    churnSignals,
    insights,
    recommendations,
    bestSendWindow,
    channelPerformance: channelPerf,
    summary: {
      totalClients: metrics.length,
      churnRiskCount: churnSignals.filter(c => c.riskLevel === "high" || c.riskLevel === "critical").length,
      avgEngagementScore: avgScore,
      bestChannel,
      bestHour: bestSendWindow?.hour ?? 18,
    },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAIReturn {
  analysis: AIAnalysisResult | null;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  churnSignals: ChurnSignal[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  summary: AIAnalysisResult["summary"] | null;
}

export function useAI(): UseAIReturn {
  const { organization } = useAuth();
  const orgId = organization?.id || "";

  const {
    data: analysis,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ai-analysis", orgId],
    queryFn: () => runAIAnalysis(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 min cache — avoid constant re-computation
    retry: 1,
  });

  // ── Realtime: auto-refresh when clients or messages change ────────────────
  useEffect(() => {
    if (!orgId) return;

    // Generate a unique channel ID to avoid collisions if multiple components use this hook
    const channelId = `ai-realtime-${orgId}-${Math.random().toString(36).substring(7)}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients", filter: `organization_id=eq.${orgId}` },
        () => {
          console.log("[useAI] Realtime: clients changed — refreshing AI analysis");
          refetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_logs", filter: `organization_id=eq.${orgId}` },
        () => {
          console.log("[useAI] Realtime: new message_log — refreshing AI analysis");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, refetch]);

  return {
    analysis: analysis || null,
    insights: analysis?.insights || [],
    recommendations: analysis?.recommendations || [],
    churnSignals: analysis?.churnSignals || [],
    isLoading,
    isError,
    refetch,
    summary: analysis?.summary || null,
  };
}

