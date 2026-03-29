/**
 * src/ai/types.ts
 * Phase 7 — AI Engine Types
 */

export interface ClientMetrics {
  id: string;
  name: string;
  organization_id: string;
  total_messages: number;
  last_interaction: string | null;
  delivered: number;
  failed: number;
  pending: number;
  days_since_interaction: number | null;
  delivery_rate: number;
}

export interface EngagementScore {
  clientId: string;
  score: number; // 0-100
  tier: "cold" | "warm" | "hot" | "vip";
  factors: {
    activityScore: number;    // 0-40
    deliveryScore: number;    // 0-30
    recencyScore: number;     // 0-30
  };
}

export interface ChurnSignal {
  clientId: string;
  clientName: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  daysInactive: number;
  deliveryRate: number;
  engagementScore: number;
  suggestedAction: "campaign" | "call" | "tag" | "monitor";
}

export interface AIInsight {
  id: string;
  type: "churn_risk" | "best_hour" | "channel" | "vip_inactive" | "campaign_suggestion" | "performance" | "trend";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  action?: {
    label: string;
    type: "navigate" | "create_campaign" | "tag_clients" | "open_crm";
    payload?: Record<string, any>;
  };
  clientIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface BestSendWindow {
  hour: number;
  dayOfWeek: number;     // 0 = Sunday
  confidence: number;    // 0-1
  avgDeliveryRate: number;
}

export interface ChannelPerformance {
  channel: "whatsapp" | "telegram" | "instagram";
  totalSent: number;
  deliveryRate: number;
  avgResponseTime?: number;
  score: number;         // composite
}

export interface AIRecommendation {
  id: string;
  priority: "urgent" | "high" | "medium" | "low";
  category: "retention" | "conversion" | "optimization" | "engagement";
  title: string;
  rationale: string;
  expectedImpact: string;
  action: {
    type: string;
    label: string;
    payload?: any;
  };
}

export interface AIAnalysisResult {
  organizationId: string;
  generatedAt: Date;
  engagementScores: EngagementScore[];
  churnSignals: ChurnSignal[];
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  bestSendWindow: BestSendWindow | null;
  channelPerformance: ChannelPerformance[];
  summary: {
    totalClients: number;
    churnRiskCount: number;
    avgEngagementScore: number;
    bestChannel: string;
    bestHour: number;
  };
}
