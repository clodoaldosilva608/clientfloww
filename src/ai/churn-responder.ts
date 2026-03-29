/**
 * src/ai/churn-responder.ts
 * Phase 7 — Churn Auto-Responder
 *
 * Monitors churn signals from the AI engine and automatically
 * enqueues reactivation workflows for at-risk clients.
 * Integrates with the existing Automation Engine (Phase 4).
 */

import { supabase } from "@/lib/supabase";
import type { ChurnSignal } from "./types";

// ─── Cooldown Cache ──────────────────────────────────────────────────────────
// Prevents re-triggering the same client within 24 hours
const triggeredCache = new Map<string, number>();

const COOLDOWN_MS    = 24 * 60 * 60 * 1000; // 24 hours
const TRIGGER_LOG    = "[ChurnResponder]";

export interface ChurnTriggerOptions {
  organizationId: string;
  dryRun?: boolean;         // If true, logs but doesn't actually enqueue
  maxTriggersPerRun?: number;
}

export interface TriggerResult {
  triggered: number;
  skipped: number;
  details: Array<{ clientId: string; clientName: string; action: string; status: "triggered" | "skipped" | "cooldown" }>;
}

/**
 * Process churn signals and enqueue automated reactivation jobs.
 */
export async function respondToChurnSignals(
  signals: ChurnSignal[],
  options: ChurnTriggerOptions
): Promise<TriggerResult> {
  const { organizationId, dryRun = false, maxTriggersPerRun = 10 } = options;
  const now = Date.now();

  const result: TriggerResult = {
    triggered: 0,
    skipped: 0,
    details: [],
  };

  // Only process critical and high severity signals
  const actionableSignals = signals
    .filter(s => s.riskLevel === "critical" || s.riskLevel === "high")
    .slice(0, maxTriggersPerRun);

  for (const signal of actionableSignals) {
    // Cooldown check
    const lastTriggered = triggeredCache.get(signal.clientId);
    if (lastTriggered && now - lastTriggered < COOLDOWN_MS) {
      result.skipped++;
      result.details.push({
        clientId: signal.clientId,
        clientName: signal.clientName,
        action: "cooldown",
        status: "cooldown",
      });
      continue;
    }

    const action = signal.suggestedAction;
    console.log(`${TRIGGER_LOG} Processing ${signal.riskLevel} risk: ${signal.clientName} — Action: ${action}`);

    if (!dryRun) {
      await enqueueChurnJob(signal, organizationId);
    }

    // Mark as triggered
    triggeredCache.set(signal.clientId, now);
    result.triggered++;
    result.details.push({
      clientId: signal.clientId,
      clientName: signal.clientName,
      action,
      status: "triggered",
    });
  }

  console.log(`${TRIGGER_LOG} Run complete. Triggered: ${result.triggered}, Skipped: ${result.skipped}`);
  return result;
}

/**
 * Enqueue a single churn response job into automation_queue.
 */
async function enqueueChurnJob(signal: ChurnSignal, organizationId: string): Promise<void> {
  try {
    const payload = {
      type: "churn_reactivation",
      clientId: signal.clientId,
      clientName: signal.clientName,
      riskLevel: signal.riskLevel,
      daysInactive: signal.daysInactive,
      autoMessage: buildAutoMessage(signal),
      triggeredAt: new Date().toISOString(),
    };

    const { error } = await (supabase as any).from("automation_queue").insert({
      organization_id: organizationId,
      client_id: signal.clientId,
      payload,
      run_at: new Date().toISOString(),
      status: "pending",
      max_attempts: 2,
    });

    if (error) {
      console.error(`${TRIGGER_LOG} Failed to enqueue churn job for ${signal.clientId}:`, error.message);
    } else {
      console.log(`${TRIGGER_LOG} Churn job enqueued for: ${signal.clientName}`);
    }
  } catch (err: any) {
    console.error(`${TRIGGER_LOG} Critical error enqueueing:`, err.message);
  }
}

/**
 * Build an automated personalized reactivation message.
 */
function buildAutoMessage(signal: ChurnSignal): string {
  const { clientName, daysInactive, riskLevel } = signal;
  const name = clientName || "cliente";

  if (riskLevel === "critical") {
    return `Oi ${name}! 😢 Sentimos muito a sua falta. Faz ${Math.round(daysInactive)} dias que não conversamos... Preparamos uma oferta especial exclusiva pra você voltar. Pode me chamar aqui! 🎁`;
  }

  return `Oi ${name}! Não te vejo faz um tempinho. Passando para dar um oi e ver se posso te ajudar em algo. Estamos aqui! 👋`;
}

/**
 * Auto-tag VIP clients that have been inactive.
 * Adds 'reativacao_necessaria' tag to clients in churn risk.
 */
export async function autoTagChurnClients(
  signals: ChurnSignal[],
  organizationId: string,
  userId: string
): Promise<number> {
  const criticals = signals.filter(s => s.riskLevel === "critical").slice(0, 20);
  if (criticals.length === 0) return 0;

  try {
    // Check which clients already have the tag to avoid duplicates
    const { data: existingTags } = await (supabase as any)
      .from("client_tags")
      .select("client_id")
      .in("client_id", criticals.map(s => s.clientId))
      .eq("tag", "reativacao_necessaria");

    const alreadyTagged = new Set((existingTags || []).map((t: any) => t.client_id));
    const toTag = criticals.filter(s => !alreadyTagged.has(s.clientId));

    if (toTag.length === 0) return 0;

    const records = toTag.map(s => ({
      client_id: s.clientId,
      tag: "reativacao_necessaria",
      user_id: userId,
      organization_id: organizationId,
    }));

    const { error } = await (supabase as any).from("client_tags").insert(records);
    if (error) throw error;

    console.log(`${TRIGGER_LOG} Auto-tagged ${records.length} clients as 'reativacao_necessaria'`);
    return records.length;
  } catch (err: any) {
    console.error(`${TRIGGER_LOG} Auto-tag error:`, err.message);
    return 0;
  }
}
