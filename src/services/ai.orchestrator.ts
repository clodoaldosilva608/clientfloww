/**
 * src/services/ai.orchestrator.ts
 * Phase 5 — AI Orchestrator
 *
 * Central brain that interprets user intents and executes real actions:
 * - "criar campanha" → creates a campaign via ai-campaign.service
 * - "segmentar clientes" → runs auto-segmentation
 * - "clientes em risco" → returns real data from Supabase
 * - "gerar mensagem" → generates marketing text via HF
 * - "insights" → returns AI analysis summary
 *
 * Also handles Phase 6 autonomous selling automation.
 */

import { supabase } from "@/lib/supabase";
import { generateText, detectIntent, classifyText } from "./ai.service";
import { generateCampaign, generateAndSaveCampaign } from "./ai-campaign.service";
import { segmentarClientesAutomaticamente, getSegmentationSummary } from "./ai-segmentation.service";
import type { ChurnSignal } from "@/ai/types";
import type { ServiceResponse } from "@/types/database";

// ─── Orchestrator Response Types ────────────────────────────────────────────

export interface OrchestratorResponse {
  message: string;
  action: string;
  data?: any;
  source: "ai" | "system" | "fallback";
  executedAction?: boolean;
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

/**
 * Process a user message from Copilot and execute real actions.
 */
export async function processUserMessage(
  userMessage: string,
  context: {
    organizationId: string;
    userId: string;
    churnSignals?: ChurnSignal[];
  }
): Promise<OrchestratorResponse> {
  const { organizationId, userId, churnSignals } = context;

  console.log(`[Orchestrator] Processing: "${userMessage}"`);

  // 1. Detect intent
  const { intent, confidence } = await detectIntent(userMessage);
  console.log(`[Orchestrator] Intent: ${intent} (confidence: ${confidence})`);

  // 2. Execute action based on intent
  switch (intent) {
    case "create_campaign":
      return await handleCreateCampaign(userMessage, organizationId);

    case "segment_clients":
      return await handleSegmentClients(organizationId);

    case "churn_risk":
      return await handleChurnRisk(organizationId, churnSignals);

    case "generate_message":
      return await handleGenerateMessage(userMessage);

    case "dashboard_insights":
      return await handleDashboardInsights(organizationId);

    case "general_question":
    default:
      return await handleGeneralQuestion(userMessage, organizationId);
  }
}

// ─── Intent Handlers ────────────────────────────────────────────────────────

async function handleCreateCampaign(
  userMessage: string,
  organizationId: string
): Promise<OrchestratorResponse> {
  try {
    const segmento = extractSegment(userMessage);
    const objetivo = extractObjective(userMessage);

    const { text, source } = await generateText(
      `Crie uma campanha de marketing. Segmento: ${segmento}, Objetivo: ${objetivo}. Contexto: "${userMessage}". Seja persuasivo e inclua CTA. Máximo 4 frases.`
    );

    return {
      message: `🤖 **Proposta de Campanha Pronta:**\n\n📌 **Segmento:** ${segmento}\n📌 **Objetivo:** ${objetivo}\n\n💬 **Texto Sugerido:**\n${text}\n\n⚠️ **Ação Necessária:** Eu não executo nem salvo campanhas sem sua aprovação. Para prosseguir, por favor crie manualmente na aba "Campanhas" copiando este texto, ou use os botões rápidos.`,
      action: "propose_campaign",
      data: { generatedText: text },
      source: source === "huggingface" ? "ai" : "fallback",
      executedAction: false,
    };
  } catch (err: any) {
    console.error("[Orchestrator] Campaign proposition error:", err);
    return {
      message: `❌ Não consegui elaborar o conteúdo: ${err.message}`,
      action: "create_campaign_error",
      source: "system",
      executedAction: false,
    };
  }
}

async function handleSegmentClients(organizationId: string): Promise<OrchestratorResponse> {
  try {
    const { data: report, error } = await segmentarClientesAutomaticamente(organizationId, {
      autoTag: false, // Nunca aplica tag sozinho!
    });

    if (error || !report) {
      return {
        message: `⚠️ Erro na segmentação: ${error || "dados insuficientes"}. Certifique-se de que há clientes cadastrados.`,
        action: "segment_error",
        source: "system",
        executedAction: false,
      };
    }

    const { segments, totalClients } = report;

    return {
      message: `✅ Sugestão de Análise Concluída!\n\n📊 **${totalClients} clientes analisados:**\n\n👑 **VIP** (score >80): ${segments.vip} clientes\n✅ **Ativos** (score 50-80): ${segments.ativo} clientes\n😴 **Inativos** (score <50): ${segments.inativo} clientes\n🚨 **Em Risco** (churn >70%): ${segments.em_risco} clientes\n\n⚠️ Conforme sua preferência de segurança, eu **NÃO** apliquei essas tags ainda. Por favor, confirme se devo prosseguir.`,
      action: "propose_segment_clients",
      data: { segments, totalClients },
      source: "system",
      executedAction: false,
    };
  } catch (err: any) {
    return {
      message: `❌ Erro na segmentação: ${err.message}`,
      action: "segment_error",
      source: "system",
      executedAction: false,
    };
  }
}

async function handleChurnRisk(
  organizationId: string,
  existingSignals?: ChurnSignal[]
): Promise<OrchestratorResponse> {
  try {
    let signals = existingSignals;

    // If no signals provided, fetch from segmentation
    if (!signals || signals.length === 0) {
      const { data: tags } = await (supabase as any)
        .from("client_tags")
        .select("client_id, clients(name, phone, email)")
        .eq("tag", "em_risco")
        .eq("organization_id", organizationId)
        .limit(20);

      if (tags && tags.length > 0) {
        const clientList = tags
          .map((t: any, i: number) => `${i + 1}. **${t.clients?.name || "Sem nome"}** — ${t.clients?.phone || "N/A"}`)
          .join("\n");

        return {
          message: `🚨 **Clientes em risco de churn:**\n\n${clientList}\n\n📌 Total: ${tags.length} clientes em risco\n\nPosso criar uma campanha de reativação automática para eles. Quer que eu faça isso?`,
          action: "churn_risk",
          data: { clients: tags, count: tags.length },
          source: "system",
          executedAction: false,
        };
      }

      return {
        message: "✅ Nenhum cliente em risco de churn detectado no momento! Sua base está saudável. 🎉",
        action: "churn_risk_none",
        source: "system",
        executedAction: false,
      };
    }

    // Use existing churn signals
    const critical = signals.filter(s => s.riskLevel === "critical");
    const high = signals.filter(s => s.riskLevel === "high");

    const clientList = [...critical, ...high]
      .slice(0, 15)
      .map((s, i) => `${i + 1}. **${s.clientName}** — ${Math.round(s.daysInactive)} dias inativo (${s.riskLevel === "critical" ? "🔴 Crítico" : "🟡 Alto"})`)
      .join("\n");

    return {
      message: `🚨 **Análise de Churn Risk**\n\n🔴 Crítico: ${critical.length} clientes\n🟡 Alto: ${high.length} clientes\n\n**Top clientes em risco:**\n${clientList}\n\nDeseja que eu crie uma campanha de reativação automática?`,
      action: "churn_risk",
      data: { critical: critical.length, high: high.length, signals: signals.slice(0, 15) },
      source: "system",
      executedAction: false,
    };
  } catch (err: any) {
    return {
      message: `❌ Erro ao buscar clientes em risco: ${err.message}`,
      action: "churn_risk_error",
      source: "system",
      executedAction: false,
    };
  }
}

async function handleGenerateMessage(userMessage: string): Promise<OrchestratorResponse> {
  try {
    const prompt = `Escreva uma mensagem de marketing profissional. Contexto: ${userMessage}. 
Use emojis, seja persuasivo, inclua CTA. Máximo 3 frases.`;

    const { text, source } = await generateText(prompt);

    return {
      message: `✍️ **Mensagem gerada:**\n\n${text}\n\n📋 Fonte: ${source === "huggingface" ? "IA Hugging Face" : "Template local"}`,
      action: "generate_message",
      data: { generatedMessage: text, source },
      source: source === "huggingface" ? "ai" : "fallback",
      executedAction: true,
    };
  } catch (err: any) {
    return {
      message: `❌ Erro ao gerar mensagem: ${err.message}`,
      action: "generate_message_error",
      source: "system",
      executedAction: false,
    };
  }
}

async function handleDashboardInsights(organizationId: string): Promise<OrchestratorResponse> {
  try {
    // Fetch summary stats
    const [{ data: segSummary }, statsResult] = await Promise.all([
      getSegmentationSummary(organizationId),
      (supabase as any).rpc("get_dashboard_stats", { p_organization_id: organizationId }),
    ]);

    const stats = statsResult?.data;

    let message = "📊 **Resumo do Dashboard**\n\n";

    if (stats) {
      message += `👥 Total de clientes: **${stats.total_clients || 0}**\n`;
      message += `💬 Mensagens enviadas: **${stats.total_messages || 0}**\n`;
      message += `✅ Mensagens entregues: **${stats.delivered_messages || 0}**\n`;
      message += `📢 Campanhas ativas: **${stats.active_campaigns || 0}**\n`;
      message += `📈 Taxa de resposta: **${stats.response_rate || 0}%**\n\n`;
    }

    if (segSummary) {
      message += `🏷️ **Segmentação:**\n`;
      message += `👑 VIP: ${segSummary.vip}\n`;
      message += `✅ Ativos: ${segSummary.ativo}\n`;
      message += `😴 Inativos: ${segSummary.inativo}\n`;
      message += `🚨 Em Risco: ${segSummary.em_risco}\n\n`;
    }

    message += "💡 Quer que eu crie uma campanha ou segmente seus clientes?";

    return {
      message,
      action: "dashboard_insights",
      data: { stats, segmentation: segSummary },
      source: "system",
      executedAction: false,
    };
  } catch (err: any) {
    return {
      message: `📊 Não consegui buscar os dados do dashboard. Erro: ${err.message}`,
      action: "dashboard_insights_error",
      source: "system",
      executedAction: false,
    };
  }
}

async function handleGeneralQuestion(
  userMessage: string,
  organizationId: string
): Promise<OrchestratorResponse> {
  try {
    const prompt = `Você é um assistente de CRM e marketing chamado ClientFlow Copilot. 
O usuário perguntou: "${userMessage}"
Responda em português brasileiro de forma clara e útil. 
Se possível, sugira ações como criar campanhas, segmentar clientes ou analisar dados.
Seja conciso (máximo 5 frases).`;

    const { text, source } = await generateText(prompt);

    return {
      message: text,
      action: "general_answer",
      source: source === "huggingface" ? "ai" : "fallback",
      executedAction: false,
    };
  } catch {
    return {
      message: "Posso te ajudar com: 📢 Criar campanhas, 🏷️ Segmentar clientes, 🚨 Ver clientes em risco, ✍️ Gerar mensagens, ou 📊 Analisar dashboard. O que deseja fazer?",
      action: "general_fallback",
      source: "fallback",
      executedAction: false,
    };
  }
}

// ─── Phase 6: Autonomous Selling System ──────────────────────────────────────

/**
 * Automated system that sells by itself.
 * Checks for inactive/at-risk clients and auto-creates + dispatches campaigns.
 */
export async function runAutonomousSellCycle(
  organizationId: string
): Promise<{
  campaignsCreated: number;
  clientsTargeted: number;
  actions: string[];
}> {
  const actions: string[] = [];
  let campaignsCreated = 0;
  let clientsTargeted = 0;

  try {
    // 1. Run segmentation
    const { data: report } = await segmentarClientesAutomaticamente(organizationId, {
      autoTag: true,
    });

    if (!report || report.totalClients === 0) {
      actions.push("⚠️ Sem clientes para processar");
      return { campaignsCreated, clientsTargeted, actions };
    }

    actions.push(`📊 ${report.totalClients} clientes analisados e segmentados`);

    // 2. Auto-create campaign for at-risk clients
    const atRiskClients = report.results.filter(r => r.segment === "em_risco");
    if (atRiskClients.length > 0) {
      const result = await generateAndSaveCampaign({
        segmento: "em_risco",
        objetivo: "reativação",
        organizationId,
      });

      if (result.data) {
        campaignsCreated++;
        clientsTargeted += atRiskClients.length;
        actions.push(`🚨 Campanha de reativação criada para ${atRiskClients.length} clientes em risco`);

        // Auto-target the campaign
        const targets = atRiskClients.map(c => ({
          campaign_id: result.data!.id,
          client_id: c.clientId,
          organization_id: organizationId,
          status: "pending",
        }));

        await (supabase as any).from("campaign_targets").insert(targets);
        actions.push(`📎 ${targets.length} clientes vinculados à campanha`);
      }
    }

    // 3. Auto-create campaign for inactive clients
    const inactiveClients = report.results.filter(r => r.segment === "inativo");
    if (inactiveClients.length > 3) {
      const result = await generateAndSaveCampaign({
        segmento: "inativos",
        objetivo: "reativação",
        organizationId,
      });

      if (result.data) {
        campaignsCreated++;
        clientsTargeted += inactiveClients.length;
        actions.push(`😴 Campanha para inativos criada: ${inactiveClients.length} clientes`);

        const targets = inactiveClients.slice(0, 50).map(c => ({
          campaign_id: result.data!.id,
          client_id: c.clientId,
          organization_id: organizationId,
          status: "pending",
        }));

        await (supabase as any).from("campaign_targets").insert(targets);
      }
    }

    // 4. Auto-create VIP engagement campaign
    const vipClients = report.results.filter(r => r.segment === "vip");
    if (vipClients.length > 0) {
      const result = await generateAndSaveCampaign({
        segmento: "VIP",
        objetivo: "fidelização",
        organizationId,
      });

      if (result.data) {
        campaignsCreated++;
        clientsTargeted += vipClients.length;
        actions.push(`👑 Campanha VIP criada para ${vipClients.length} clientes`);
      }
    }

    actions.push(`✅ Ciclo autônomo concluído: ${campaignsCreated} campanhas, ${clientsTargeted} clientes`);

  } catch (err: any) {
    actions.push(`❌ Erro no ciclo autônomo: ${err.message}`);
  }

  return { campaignsCreated, clientsTargeted, actions };
}

// ─── Utility: Extract Segment/Objective from Message ────────────────────────

function extractSegment(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("vip")) return "VIP";
  if (msg.includes("inativ")) return "inativos";
  if (msg.includes("risco") || msg.includes("churn")) return "em_risco";
  if (msg.includes("ativ")) return "ativos";
  if (msg.includes("novo")) return "novos";
  return "ativos"; // default
}

function extractObjective(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("reativa")) return "reativação";
  if (msg.includes("fideliza")) return "fidelização";
  if (msg.includes("upsell") || msg.includes("upgrade")) return "upsell";
  if (msg.includes("promo") || msg.includes("oferta") || msg.includes("desconto")) return "promoção";
  if (msg.includes("boas-vindas") || msg.includes("welcome")) return "boas-vindas";
  return "engajamento"; // default
}

// ─── Dashboard Insights Generator ───────────────────────────────────────────

/**
 * Generate AI-powered dashboard insights
 */
export async function gerarInsightsDashboard(organizationId: string): Promise<{
  suggestaoIA: string;
  clientesEmRisco: number;
  campanhasRecomendadas: string[];
}> {
  try {
    const { data: segSummary } = await getSegmentationSummary(organizationId);

    const emRisco = segSummary?.em_risco || 0;
    const inativos = segSummary?.inativo || 0;
    const vip = segSummary?.vip || 0;

    // Generate smart suggestion
    let suggestaoIA = "";
    const campanhasRecomendadas: string[] = [];

    if (emRisco > 0) {
      suggestaoIA = `🚨 Há ${emRisco} clientes em risco de churn. Recomendo campanha de reativação urgente.`;
      campanhasRecomendadas.push("Reativação — Clientes em Risco");
    }

    if (inativos > 3) {
      suggestaoIA += suggestaoIA ? "\n" : "";
      suggestaoIA += `😴 ${inativos} clientes inativos detectados. Uma campanha de follow-up pode recuperar até 20%.`;
      campanhasRecomendadas.push("Follow-up — Clientes Inativos");
    }

    if (vip > 0) {
      campanhasRecomendadas.push("Fidelização — VIPs");
    }

    if (!suggestaoIA) {
      suggestaoIA = "✅ Sua base está saudável! Continue monitorando e mantenha o engajamento alto.";
    }

    // Try to enrich with HF
    try {
      const { text } = await generateText(
        `Dê uma sugestão rápida de marketing para um negócio com ${emRisco} clientes em risco, ${inativos} inativos e ${vip} VIPs. Uma frase apenas.`
      );
      if (text && text.length > 10) {
        suggestaoIA = text;
      }
    } catch {
      // Keep local suggestion
    }

    return {
      suggestaoIA,
      clientesEmRisco: emRisco,
      campanhasRecomendadas,
    };
  } catch (err: any) {
    return {
      suggestaoIA: "Não foi possível gerar insights no momento.",
      clientesEmRisco: 0,
      campanhasRecomendadas: [],
    };
  }
}
