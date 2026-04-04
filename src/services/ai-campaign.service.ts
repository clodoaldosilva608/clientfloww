/**
 * src/services/ai-campaign.service.ts
 * Phase 2 — AI Campaign Auto-Generator
 *
 * Uses Hugging Face to generate full campaigns automatically.
 * Saves to campaigns table with type="ia".
 */

import { supabase } from "@/lib/supabase";
import { generateText } from "./ai.service";
import type { Campaign, ServiceResponse } from "@/types/database";

export interface GenerateCampaignParams {
  segmento: string;        // e.g., "VIP", "inativos", "em_risco"
  objetivo: string;        // e.g., "reativação", "upsell", "fidelização"
  platform?: "whatsapp" | "telegram" | "instagram";
  tone?: "formal" | "casual" | "urgente";
  organizationId: string;
}

export interface GeneratedCampaign {
  titulo: string;
  conteudo: string;
  tipo: "ia";
  platform: string;
  segmento: string;
  objetivo: string;
}

/**
 * Generate a full campaign using AI (Hugging Face)
 */
export async function generateCampaign(params: GenerateCampaignParams): Promise<{
  campaign: GeneratedCampaign;
  source: "huggingface" | "fallback";
}> {
  const { segmento, objetivo, platform = "whatsapp", tone = "casual" } = params;

  const prompt = buildCampaignPrompt(segmento, objetivo, platform, tone);
  
  const { text, source } = await generateText(prompt);

  // Parse AI response into structured campaign
  const parsed = parseCampaignResponse(text, segmento, objetivo, platform);

  return {
    campaign: parsed,
    source,
  };
}

/**
 * Generate and save campaign directly to Supabase
 */
export async function generateAndSaveCampaign(params: GenerateCampaignParams): Promise<ServiceResponse<Campaign>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Usuário não autenticado" };

    // Generate with AI
    const { campaign, source } = await generateCampaign(params);

    const campaignData: any = {
      name: campaign.titulo,
      message: campaign.conteudo,
      status: "draft",
      organization_id: params.organizationId,
      user_id: user.id,
    };

    // Tenta incluir platform/channel de forma segura
    try {
      const { data: cols } = await (supabase as any).from("campaigns").select("*").limit(1);
      if (cols && cols.length > 0) {
        if ("platform" in cols[0]) campaignData.platform = campaign.platform;
        else if ("channel" in cols[0]) campaignData.channel = campaign.platform;
      } else {
        // Fallback guess: the error indicated 'platform' is what failed earlier, so try 'channel' if we can't probe
        campaignData.platform = campaign.platform;
      }
    } catch {
       campaignData.platform = campaign.platform;
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert(campaignData)
      .select()
      .single();


    if (error) {
      console.error("[AI Campaign] Save error:", error.message);
      return { data: null, error: error.message };
    }

    console.log(`[AI Campaign] Campaign generated (source: ${source}) and saved: ${campaign.titulo}`);
    return { data: data as Campaign, error: null };
  } catch (err: any) {
    console.error("[AI Campaign] Critical error:", err);
    return { data: null, error: err.message };
  }
}

/**
 * Generate multiple campaigns for different segments at once
 */
export async function generateBulkCampaigns(
  segments: string[],
  objetivo: string,
  organizationId: string
): Promise<{ campaigns: GeneratedCampaign[]; errors: string[] }> {
  const campaigns: GeneratedCampaign[] = [];
  const errors: string[] = [];

  for (const segmento of segments) {
    try {
      const { campaign } = await generateCampaign({
        segmento,
        objetivo,
        organizationId,
      });
      campaigns.push(campaign);
    } catch (err: any) {
      errors.push(`Segment "${segmento}": ${err.message}`);
    }
  }

  return { campaigns, errors };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function buildCampaignPrompt(
  segmento: string,
  objetivo: string,
  platform: string,
  tone: string
): string {
  const toneMap: Record<string, string> = {
    formal: "profissional e respeitoso",
    casual: "amigável e descontraído",
    urgente: "urgente e persuasivo",
  };

  return `Crie uma campanha de marketing para clientes do segmento ${segmento} com objetivo de ${objetivo}. 
Use linguagem persuasiva, CTA forte e tom ${toneMap[tone] || "profissional"}.
A campanha será enviada via ${platform}.

Formato da resposta:
TÍTULO: [título da campanha em até 60 caracteres]
MENSAGEM: [mensagem completa com emojis, máximo 3 parágrafos curtos]

Importante:
- Use emojis relevantes
- Inclua um CTA claro no final
- Personalize com {clientName} como placeholder
- Seja direto e convincente`;
}

function parseCampaignResponse(
  text: string,
  segmento: string,
  objetivo: string,
  platform: string
): GeneratedCampaign {
  let titulo = "";
  let conteudo = "";

  // Try to parse structured response
  const tituloMatch = text.match(/T[ÍI]TULO:\s*(.+?)(?:\n|$)/i);
  const mensagemMatch = text.match(/MENSAGEM:\s*([\s\S]+)/i);

  if (tituloMatch && mensagemMatch) {
    titulo = tituloMatch[1].trim();
    conteudo = mensagemMatch[1].trim();
  } else {
    // Unstructured response — use first line as title, rest as content
    const lines = text.split("\n").filter(l => l.trim());
    titulo = lines[0]?.substring(0, 60) || `Campanha IA — ${segmento}`;
    conteudo = lines.slice(1).join("\n").trim() || text;
  }

  // Clean up
  titulo = titulo.replace(/^["'*#]+|["'*#]+$/g, "").trim();
  conteudo = conteudo.replace(/^["']+|["']+$/g, "").trim();

  // Fallback if empty
  if (!titulo) titulo = `Campanha ${objetivo} — ${segmento}`;
  if (!conteudo) {
    conteudo = generateFallbackMessage(segmento, objetivo);
  }

  return {
    titulo,
    conteudo,
    tipo: "ia",
    platform,
    segmento,
    objetivo,
  };
}

function generateFallbackMessage(segmento: string, objetivo: string): string {
  const messages: Record<string, Record<string, string>> = {
    VIP: {
      reativação: "👑 Olá {clientName}! Você é um dos nossos clientes mais especiais. Sentimos sua falta e preparamos uma oferta VIP exclusiva para você. 🎁\n\nSó os melhores têm acesso a isso. Não perca essa oportunidade única!\n\n💎 Responda agora e garanta seus benefícios exclusivos →",
      upsell: "🌟 {clientName}, como nosso cliente VIP, você tem acesso antecipado ao nosso novo plano premium. Upgrade agora e desbloqueie recursos exclusivos!\n\n🚀 Responda SIM para saber mais →",
      fidelização: "❤️ {clientName}, você é incrível! Obrigado por estar conosco. Como reconhecimento, preparamos um crédito especial na sua conta.\n\n🎉 Aproveite agora →",
    },
    inativos: {
      reativação: "👋 Oi {clientName}! Faz um tempo que não te vemos por aqui e sentimos muita falta! 😢\n\nPreparamos algo especial só pra você voltar: uma oferta exclusiva que expira em 48h! ⏰\n\n🎁 Responda agora e garanta →",
      default: "🔄 {clientName}, estamos de volta com novidades incríveis! Não fique de fora. Responda para saber mais! 🚀",
    },
    em_risco: {
      reativação: "🚨 {clientName}, queremos muito manter você conosco! Preparamos condições especiais exclusivas pra você continuar aproveitando nossos benefícios.\n\n💪 Vamos juntos? Responda agora →",
      default: "⚡ {clientName}, percebemos que faz um tempo. Queremos ouvir você! O que podemos fazer melhor? Responda aqui →",
    },
    ativos: {
      upsell: "🎯 {clientName}! Já que você adora nossos serviços, que tal conhecer nosso plano avançado? Mais recursos, mais resultados! 📈\n\n🔥 Saiba mais agora →",
      fidelização: "🙏 Obrigado por estar sempre com a gente, {clientName}! Seu apoio é fundamental. Preparamos uma surpresa para você! 🎁\n\n💫 Responda para revelar →",
      default: "🌟 {clientName}! Temos novidades incríveis que vão turbinar seus resultados. Não perca! 🚀\n\n👉 Responda para saber mais →",
    },
  };

  const segmentMessages = messages[segmento] || messages.ativos;
  return (segmentMessages as any)[objetivo] || (segmentMessages as any).default || (segmentMessages as any)[Object.keys(segmentMessages)[0]] || "Mensagem de campanha personalizada para {clientName}.";
}
