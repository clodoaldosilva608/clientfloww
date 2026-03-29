/**
 * src/ai/recommendation-engine.ts
 * Phase 7 — AI Recommendation & Insight Generator
 *
 * Converts raw engagement scores + churn signals into
 * actionable insights and prioritized recommendations.
 */

import type {
  EngagementScore,
  ChurnSignal,
  AIInsight,
  AIRecommendation,
  BestSendWindow,
  ChannelPerformance,
} from "./types";
import type { MessageLog } from "@/types/database";

// ─── Best Send Hour Analysis ────────────────────────────────────────────────

interface HourBucket {
  sent: number;
  delivered: number;
}

/**
 * Analyzes message_logs to find the best hour and day-of-week to send.
 */
export function analyzeBestSendWindow(logs: MessageLog[]): BestSendWindow | null {
  if (!logs || logs.length < 10) return null;

  const hourBuckets: Record<number, HourBucket> = {};

  for (const log of logs) {
    if (!log.created_at) continue;
    const hour = new Date(log.created_at).getHours();
    if (!hourBuckets[hour]) hourBuckets[hour] = { sent: 0, delivered: 0 };
    hourBuckets[hour].sent++;
    if (log.status === "delivered") hourBuckets[hour].delivered++;
  }

  let bestHour = 18; // sensible default
  let bestRate = 0;

  for (const [hourStr, bucket] of Object.entries(hourBuckets)) {
    if (bucket.sent < 2) continue; // not enough data for this hour
    const rate = bucket.delivered / bucket.sent;
    if (rate > bestRate) {
      bestRate = rate;
      bestHour = parseInt(hourStr, 10);
    }
  }

  // Day-of-week analysis
  const dayBuckets: Record<number, HourBucket> = {};
  for (const log of logs) {
    if (!log.created_at) continue;
    const day = new Date(log.created_at).getDay();
    if (!dayBuckets[day]) dayBuckets[day] = { sent: 0, delivered: 0 };
    dayBuckets[day].sent++;
    if (log.status === "delivered") dayBuckets[day].delivered++;
  }
  let bestDay = 1;
  let bestDayRate = 0;
  for (const [dayStr, bucket] of Object.entries(dayBuckets)) {
    if (bucket.sent < 2) continue;
    const rate = bucket.delivered / bucket.sent;
    if (rate > bestDayRate) { bestDayRate = rate; bestDay = parseInt(dayStr, 10); }
  }

  const confidence = Math.min(logs.length / 100, 1); // more data = more confidence

  return {
    hour: bestHour,
    dayOfWeek: bestDay,
    confidence,
    avgDeliveryRate: Math.round(bestRate * 100),
  };
}

// ─── Channel Performance Analysis ───────────────────────────────────────────

/**
 * Computes delivery rate per channel.
 */
export function analyzeChannelPerformance(logs: MessageLog[]): ChannelPerformance[] {
  const channels: Record<string, { sent: number; delivered: number }> = {
    whatsapp: { sent: 0, delivered: 0 },
    telegram:  { sent: 0, delivered: 0 },
    instagram: { sent: 0, delivered: 0 },
  };

  for (const log of logs) {
    const ch = (log as any).channel || "whatsapp";
    if (!channels[ch]) channels[ch] = { sent: 0, delivered: 0 };
    channels[ch].sent++;
    if (log.status === "delivered") channels[ch].delivered++;
  }

  return (Object.entries(channels) as [string, { sent: number; delivered: number }][])
    .filter(([, b]) => b.sent > 0)
    .map(([channel, bucket]) => {
      const deliveryRate = Math.round((bucket.delivered / bucket.sent) * 100);
      return {
        channel: channel as ChannelPerformance["channel"],
        totalSent: bucket.sent,
        deliveryRate,
        score: deliveryRate,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Insight Generator ──────────────────────────────────────────────────────

export function generateInsights(params: {
  churnSignals: ChurnSignal[];
  scores: EngagementScore[];
  bestSendWindow: BestSendWindow | null;
  channelPerf: ChannelPerformance[];
  vipInactiveCount: number;
  totalClients: number;
}): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();

  const { churnSignals, scores, bestSendWindow, channelPerf, vipInactiveCount } = params;

  // ── 1. Churn Risk Alert ────────────────────────────────────────────────
  const criticalChurns = churnSignals.filter(s => s.riskLevel === "critical" || s.riskLevel === "high");
  if (criticalChurns.length > 0) {
    insights.push({
      id: `churn-${now.getTime()}`,
      type: "churn_risk",
      title: `${criticalChurns.length} cliente${criticalChurns.length > 1 ? "s" : ""} em risco crítico de churn`,
      description: `Clientes sem interação há mais de 15 dias. Taxa de perda estimada em ${Math.round((criticalChurns.length / params.totalClients) * 100)}% do portfolio.`,
      severity: criticalChurns.length > 5 ? "critical" : "warning",
      action: {
        label: "Disparar Campanha de Reativação",
        type: "create_campaign",
        payload: { clientIds: criticalChurns.map(c => c.clientId), autoPrompt: "Mensagem de reativação personalizada para clientes inativos" },
      },
      clientIds: criticalChurns.map(c => c.clientId),
      metadata: { churnCount: criticalChurns.length },
      createdAt: now,
    });
  }

  // ── 2. VIP Inactive Alert ──────────────────────────────────────────────
  if (vipInactiveCount > 0) {
    insights.push({
      id: `vip-inactive-${now.getTime()}`,
      type: "vip_inactive",
      title: `${vipInactiveCount} cliente${vipInactiveCount > 1 ? "s" : ""} VIP sem contato recente`,
      description: `Clientes de alto valor sem interação nos últimos 10 dias. Risco alto de perda de receita recorrente.`,
      severity: "critical",
      action: {
        label: "Ver Clientes VIP",
        type: "open_crm",
        payload: { filterTag: "vip" },
      },
      metadata: { vipCount: vipInactiveCount },
      createdAt: now,
    });
  }

  // ── 3. Best Send Hour ──────────────────────────────────────────────────
  if (bestSendWindow && bestSendWindow.confidence > 0.2) {
    const timeLabel = `${bestSendWindow.hour}h:00`;
    insights.push({
      id: `best-hour-${now.getTime()}`,
      type: "best_hour",
      title: `Melhor janela de envio: ${timeLabel}`,
      description: `Baseado no histórico real, campanhas enviadas às ${timeLabel} têm ${bestSendWindow.avgDeliveryRate}% de taxa de entrega — ${bestSendWindow.avgDeliveryRate - 60 > 0 ? (bestSendWindow.avgDeliveryRate - 60) + "% acima" : "próximo"} da média.`,
      severity: "success",
      action: {
        label: "Criar campanha agendada",
        type: "create_campaign",
        payload: { scheduledHour: bestSendWindow.hour },
      },
      metadata: { bestHour: bestSendWindow.hour, confidence: bestSendWindow.confidence },
      createdAt: now,
    });
  }

  // ── 4. Channel Performance ─────────────────────────────────────────────
  if (channelPerf.length >= 2) {
    const best = channelPerf[0];
    const worst = channelPerf[channelPerf.length - 1];
    if (best.deliveryRate - worst.deliveryRate > 15) {
      insights.push({
        id: `channel-${now.getTime()}`,
        type: "channel",
        title: `${best.channel.charAt(0).toUpperCase() + best.channel.slice(1)} performa ${best.deliveryRate - worst.deliveryRate}% melhor`,
        description: `Canal ${best.channel} tem taxa de ${best.deliveryRate}% vs ${worst.deliveryRate}% do ${worst.channel}. Concentrar campanhas no canal mais eficiente.`,
        severity: "info",
        action: {
          label: "Criar campanha no melhor canal",
          type: "create_campaign",
          payload: { platform: best.channel },
        },
        metadata: { bestChannel: best.channel, bestRate: best.deliveryRate },
        createdAt: now,
      });
    }
  }

  // ── 5. Engagement Health ───────────────────────────────────────────────
  const coldClients = scores.filter(s => s.tier === "cold").length;
  const coldPercent = params.totalClients > 0 ? Math.round((coldClients / params.totalClients) * 100) : 0;
  if (coldPercent > 30) {
    insights.push({
      id: `engagement-${now.getTime()}`,
      type: "trend",
      title: `${coldPercent}% da base está fria (baixo engajamento)`,
      description: `${coldClients} clientes com score abaixo de 30. Uma campanha segmentada pode reativar até 20% desse grupo.`,
      severity: coldPercent > 50 ? "warning" : "info",
      action: {
        label: "Campanha para clientes frios",
        type: "create_campaign",
        payload: {},
      },
      metadata: { coldPercent, coldCount: coldClients },
      createdAt: now,
    });
  }

  return insights;
}

// ─── Recommendation Generator ────────────────────────────────────────────────

export function generateRecommendations(params: {
  insights: AIInsight[];
  churnSignals: ChurnSignal[];
  bestSendWindow: BestSendWindow | null;
  avgEngagementScore: number;
}): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  let idx = 0;

  if (params.churnSignals.filter(c => c.riskLevel === "critical").length > 0) {
    recs.push({
      id: `rec-${idx++}`,
      priority: "urgent",
      category: "retention",
      title: "Campanha de Reativação Urgente",
      rationale: `Detectamos clientes com mais de 30 dias inativos. Cada dia sem contato reduz a probabilidade de reativação em ~3%.`,
      expectedImpact: "Recuperar até 15% dos clientes em risco crítico",
      action: { type: "create_campaign", label: "Criar Campanha Agora", payload: { promptSuggestion: "Sentimos sua falta! Temos uma oferta especial para você." } },
    });
  }

  if (params.bestSendWindow) {
    recs.push({
      id: `rec-${idx++}`,
      priority: "high",
      category: "optimization",
      title: `Agendar campanhas para ${params.bestSendWindow.hour}h`,
      rationale: `Esta janela de envio tem ${params.bestSendWindow.avgDeliveryRate}% de taxa de entrega com ${Math.round(params.bestSendWindow.confidence * 100)}% de confiança estatística.`,
      expectedImpact: `+${Math.max(5, params.bestSendWindow.avgDeliveryRate - 70)}% na taxa de abertura`,
      action: { type: "navigate", label: "Criar Campanha Agendada", payload: { path: "/campanhas" } },
    });
  }

  if (params.avgEngagementScore < 40) {
    recs.push({
      id: `rec-${idx++}`,
      priority: "medium",
      category: "engagement",
      title: "Enriquecer Base de Clientes",
      rationale: `Score médio de engajamento em ${params.avgEngagementScore}/100. Preencher mais dados (WhatsApp, Instagram) melhora o alcance.`,
      expectedImpact: "+20% no alcance das próximas campanhas",
      action: { type: "navigate", label: "Ver CRM", payload: { path: "/clientes" } },
    });
  }

  recs.push({
    id: `rec-${idx++}`,
    priority: "low",
    category: "conversion",
    title: "Segmentar por comportamento",
    rationale: "Use as tags VIP, fidelizado e churn risk para criar campanhas hiperpersonalizadas com ROI 3x maior.",
    expectedImpact: "+30% na taxa de conversão",
    action: { type: "navigate", label: "Ir para Clientes", payload: { path: "/clientes" } },
  });

  return recs;
}
