/**
 * src/ai/engagement-engine.ts
 * Phase 7 — Engagement Score & Churn Predictor
 *
 * Runs fully client-side (no external API calls).
 * Uses weighted heuristics to produce a 0-100 engagement score.
 */

import type { ClientMetrics, EngagementScore, ChurnSignal } from "./types";

// ─── Weights ───────────────────────────────────────────────────────────────
const WEIGHT_ACTIVITY  = 40; // Volume of messages
const WEIGHT_DELIVERY  = 30; // Delivery success rate
const WEIGHT_RECENCY   = 30; // Days since last interaction

// ─── Thresholds ────────────────────────────────────────────────────────────
const HIGH_VOLUME_THRESHOLD  = 20;    // messages to get full activity score
const MED_VOLUME_THRESHOLD   = 5;
const CHURN_DAYS_CRITICAL    = 30;
const CHURN_DAYS_HIGH        = 15;
const CHURN_DAYS_MEDIUM      = 7;

/**
 * Calculate a 0-100 engagement score for a single client.
 */
export function calculateEngagementScore(client: ClientMetrics): EngagementScore {
  // --- Activity sub-score (0-40) ---
  let activityScore = 0;
  if (client.total_messages >= HIGH_VOLUME_THRESHOLD) {
    activityScore = WEIGHT_ACTIVITY;
  } else if (client.total_messages >= MED_VOLUME_THRESHOLD) {
    activityScore = Math.round((client.total_messages / HIGH_VOLUME_THRESHOLD) * WEIGHT_ACTIVITY);
  } else if (client.total_messages > 0) {
    activityScore = Math.round((client.total_messages / MED_VOLUME_THRESHOLD) * (WEIGHT_ACTIVITY * 0.4));
  }

  // --- Delivery sub-score (0-30) ---
  let deliveryScore = 0;
  if (client.total_messages > 0) {
    deliveryScore = Math.round((client.delivery_rate / 100) * WEIGHT_DELIVERY);
  }

  // --- Recency sub-score (0-30) ---
  let recencyScore = 0;
  const days = client.days_since_interaction;
  if (days === null || client.total_messages === 0) {
    recencyScore = 0;
  } else if (days <= 3) {
    recencyScore = WEIGHT_RECENCY;
  } else if (days <= 7) {
    recencyScore = Math.round(WEIGHT_RECENCY * 0.85);
  } else if (days <= 14) {
    recencyScore = Math.round(WEIGHT_RECENCY * 0.60);
  } else if (days <= 30) {
    recencyScore = Math.round(WEIGHT_RECENCY * 0.25);
  }

  const score = Math.min(activityScore + deliveryScore + recencyScore, 100);

  let tier: EngagementScore["tier"];
  if (score >= 80) tier = "vip";
  else if (score >= 55) tier = "hot";
  else if (score >= 30) tier = "warm";
  else tier = "cold";

  return {
    clientId: client.id,
    score,
    tier,
    factors: { activityScore, deliveryScore, recencyScore },
  };
}

/**
 * Detect churn risk for a single client.
 */
export function detectChurnRisk(
  client: ClientMetrics,
  engagementScore: number
): ChurnSignal | null {
  const days = client.days_since_interaction ?? 999;
  const noMessages = client.total_messages === 0;
  const badDelivery = client.delivery_rate < 40 && client.total_messages > 2;

  // No risk at all
  if (days < CHURN_DAYS_MEDIUM && !badDelivery && !noMessages) return null;

  let riskLevel: ChurnSignal["riskLevel"];
  let suggestedAction: ChurnSignal["suggestedAction"];

  if (days >= CHURN_DAYS_CRITICAL || noMessages) {
    riskLevel = "critical";
    suggestedAction = "campaign";
  } else if (days >= CHURN_DAYS_HIGH || badDelivery) {
    riskLevel = "high";
    suggestedAction = "campaign";
  } else if (days >= CHURN_DAYS_MEDIUM) {
    riskLevel = "medium";
    suggestedAction = "monitor";
  } else {
    riskLevel = "low";
    suggestedAction = "monitor";
  }

  return {
    clientId: client.id,
    clientName: client.name,
    riskLevel,
    daysInactive: days,
    deliveryRate: client.delivery_rate,
    engagementScore,
    suggestedAction,
  };
}

/**
 * Process a list of metrics into scored + churn-tagged results.
 */
export function processClientMetrics(metrics: ClientMetrics[]): {
  scores: EngagementScore[];
  churnSignals: ChurnSignal[];
  avgScore: number;
} {
  const scores: EngagementScore[] = [];
  const churnSignals: ChurnSignal[] = [];

  for (const client of metrics) {
    const scored = calculateEngagementScore(client);
    scores.push(scored);

    const churn = detectChurnRisk(client, scored.score);
    if (churn) churnSignals.push(churn);
  }

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
      : 0;

  return { scores, churnSignals, avgScore };
}
