/**
 * src/services/ai-segmentation.service.ts
 * Phase 3 — Automatic Client Segmentation (AI-Powered)
 *
 * Classifies clients by:
 * - Engagement score
 * - Response frequency
 * - Last interaction date
 *
 * Segments:
 * - VIP → score > 80
 * - Ativos → score 50–80
 * - Inativos → score < 50
 * - Em Risco → churn > 70%
 *
 * Auto-tags clients in client_tags table.
 */

import { supabase } from "@/lib/supabase";
import { processClientMetrics } from "@/ai/engagement-engine";
import type { ClientMetrics, EngagementScore, ChurnSignal } from "@/ai/types";
import type { ServiceResponse } from "@/types/database";

// ─── Segment Definitions ───────────────────────────────────────────────────

export type ClientSegment = "vip" | "ativo" | "inativo" | "em_risco";

export interface SegmentationResult {
  clientId: string;
  clientName: string;
  segment: ClientSegment;
  score: number;
  churnRisk: number;
  tags: string[];
  reason: string;
}

export interface SegmentationReport {
  totalClients: number;
  segments: Record<ClientSegment, number>;
  results: SegmentationResult[];
  tagsApplied: number;
  executedAt: Date;
}

// ─── Segment Logic ─────────────────────────────────────────────────────────

function classifyClient(
  score: EngagementScore,
  churn: ChurnSignal | null,
  clientName: string
): SegmentationResult {
  const churnRisk = churn
    ? churn.riskLevel === "critical" ? 90
    : churn.riskLevel === "high" ? 75
    : churn.riskLevel === "medium" ? 50
    : 25
    : 0;

  let segment: ClientSegment;
  let tags: string[] = [];
  let reason: string;

  // Priority: Em Risco > VIP > Ativo > Inativo
  if (churnRisk > 70) {
    segment = "em_risco";
    tags = ["em_risco", "reativacao_necessaria"];
    reason = `Churn risk ${churnRisk}% — ${churn?.daysInactive || "?"} dias inativo`;
  } else if (score.score > 80) {
    segment = "vip";
    tags = ["vip", "alto_valor"];
    reason = `Score ${score.score}/100 — Tier ${score.tier}`;
  } else if (score.score >= 50) {
    segment = "ativo";
    tags = ["ativo"];
    reason = `Score ${score.score}/100 — Engajamento moderado`;
  } else {
    segment = "inativo";
    tags = ["inativo", "baixo_engajamento"];
    reason = `Score ${score.score}/100 — Baixo engajamento`;
  }

  return {
    clientId: score.clientId,
    clientName,
    segment,
    score: score.score,
    churnRisk,
    tags,
    reason,
  };
}

// ─── Main Segmentation Function ─────────────────────────────────────────────

/**
 * Execute automatic segmentation for all clients in the organization.
 * Fetches metrics, computes scores, classifies, and auto-tags.
 */
export async function segmentarClientesAutomaticamente(
  organizationId: string,
  options: {
    dryRun?: boolean;
    autoTag?: boolean;
  } = {}
): Promise<ServiceResponse<SegmentationReport>> {
  const { dryRun = false, autoTag = true } = options;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Usuário não autenticado" };

    // 1. Fetch client metrics
    const { data: metricsRaw, error: metricsError } = await (supabase as any)
      .from("client_metrics")
      .select("*")
      .eq("organization_id", organizationId)
      .limit(1000);

    if (metricsError) {
      console.error("[Segmentation] Metrics error:", metricsError.message);
      return { data: null, error: metricsError.message };
    }

    const metrics: ClientMetrics[] = (metricsRaw || []).map((row: any) => ({
      ...row,
      total_messages: Number(row.total_messages || 0),
      delivered: Number(row.delivered || 0),
      failed: Number(row.failed || 0),
      pending: Number(row.pending || 0),
      delivery_rate: Number(row.delivery_rate || 0),
      days_since_interaction: row.days_since_interaction ? Number(row.days_since_interaction) : null,
    }));

    if (metrics.length === 0) {
      return {
        data: {
          totalClients: 0,
          segments: { vip: 0, ativo: 0, inativo: 0, em_risco: 0 },
          results: [],
          tagsApplied: 0,
          executedAt: new Date(),
        },
        error: null,
      };
    }

    // 2. Run engagement scoring
    const { scores, churnSignals } = processClientMetrics(metrics);

    // Build churn map
    const churnMap = new Map<string, ChurnSignal>();
    for (const signal of churnSignals) {
      churnMap.set(signal.clientId, signal);
    }

    // Build name map
    const nameMap = new Map<string, string>();
    for (const m of metrics) {
      nameMap.set(m.id, m.name);
    }

    // 3. Classify each client
    const results: SegmentationResult[] = scores.map(score =>
      classifyClient(score, churnMap.get(score.clientId) || null, nameMap.get(score.clientId) || "")
    );

    // 4. Count segments
    const segments: Record<ClientSegment, number> = { vip: 0, ativo: 0, inativo: 0, em_risco: 0 };
    for (const r of results) {
      segments[r.segment]++;
    }

    // 5. Auto-tag clients (if not dry run)
    let tagsApplied = 0;

    if (autoTag && !dryRun) {
      tagsApplied = await applySegmentTags(results, organizationId, user.id);
    }

    const report: SegmentationReport = {
      totalClients: results.length,
      segments,
      results,
      tagsApplied,
      executedAt: new Date(),
    };

    console.log(
      `[Segmentation] Complete: ${report.totalClients} clients segmented. ` +
      `VIP: ${segments.vip}, Ativos: ${segments.ativo}, Inativos: ${segments.inativo}, Em Risco: ${segments.em_risco}. ` +
      `Tags applied: ${tagsApplied}`
    );

    return { data: report, error: null };
  } catch (err: any) {
    console.error("[Segmentation] Critical error:", err);
    return { data: null, error: err.message };
  }
}

/**
 * Apply segment tags to clients in Supabase.
 * Removes old segment tags before applying new ones to prevent conflicts.
 */
async function applySegmentTags(
  results: SegmentationResult[],
  organizationId: string,
  userId: string
): Promise<number> {
  const SEGMENT_TAGS = ["vip", "ativo", "inativo", "em_risco", "alto_valor", "baixo_engajamento", "reativacao_necessaria"];

  try {
    // Remove existing segment tags for all affected clients
    const clientIds = results.map(r => r.clientId);
    
    if (clientIds.length > 0) {
      await (supabase as any)
        .from("client_tags")
        .delete()
        .in("client_id", clientIds)
        .in("tag", SEGMENT_TAGS)
        .eq("organization_id", organizationId);
    }

    // Insert new tags
    const tagRecords: Array<{
      client_id: string;
      tag: string;
      user_id: string;
      organization_id: string;
    }> = [];

    for (const result of results) {
      for (const tag of result.tags) {
        tagRecords.push({
          client_id: result.clientId,
          tag,
          user_id: userId,
          organization_id: organizationId,
        });
      }
    }

    if (tagRecords.length === 0) return 0;

    // Batch insert (Supabase handles up to ~1000 per call)
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < tagRecords.length; i += batchSize) {
      const batch = tagRecords.slice(i, i + batchSize);
      const { error } = await (supabase as any)
        .from("client_tags")
        .insert(batch);

      if (error) {
        console.error(`[Segmentation] Tag batch ${i} error:`, error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    return totalInserted;
  } catch (err: any) {
    console.error("[Segmentation] Tag application error:", err.message);
    return 0;
  }
}

/**
 * Get segmentation summary for dashboard cards
 */
export async function getSegmentationSummary(
  organizationId: string
): Promise<ServiceResponse<Record<ClientSegment, number>>> {
  try {
    const { data: tags, error } = await (supabase as any)
      .from("client_tags")
      .select("tag, client_id")
      .in("tag", ["vip", "ativo", "inativo", "em_risco"])
      .eq("organization_id", organizationId);

    if (error) return { data: null, error: error.message };

    const counts: Record<ClientSegment, Set<string>> = {
      vip: new Set(),
      ativo: new Set(),
      inativo: new Set(),
      em_risco: new Set(),
    };

    for (const t of tags || []) {
      if (counts[t.tag as ClientSegment]) {
        counts[t.tag as ClientSegment].add(t.client_id);
      }
    }

    return {
      data: {
        vip: counts.vip.size,
        ativo: counts.ativo.size,
        inativo: counts.inativo.size,
        em_risco: counts.em_risco.size,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
