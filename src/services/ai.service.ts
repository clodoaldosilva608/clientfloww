/**
 * src/services/ai.service.ts
 * Phase 7 — Gemini / Supabase Edge Function AI Service
 *
 * Connects to the Supabase Edge Function `generate-text` which utilizes 
 * the user's Gemini API key configured in `integration_configs`.
 */

import { supabase } from "@/lib/supabase";

// ─── Response Cache ─────────────────────────────────────────────────────────
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key: string): any | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedResponse(key: string, data: any): void {
  if (responseCache.size > 100) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate text using Supabase Edge Function (Gemini)
 */
export async function generateText(prompt: string): Promise<{ text: string; source: string }> {
  const cacheKey = `gen:${prompt.substring(0, 100)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    // Buscar chave do Gemini
    const { data: configData, error: configError } = await (supabase as any)
      .from("integration_configs")
      .select("config")
      .eq("user_id", user.id)
      .eq("platform", "gemini")
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !configData?.config?.api_key) {
      throw new Error("Chave do Gemini não configurada");
    }

    const apiKey = configData.config.api_key;
    const systemPrompt = "Você é um assistente Copilot especializado em marketing digital e CRM. Responda de forma clara, prestativa e em português brasileiro.";

    const reqBody = JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUsuário: ${prompt}` }]
      }]
    });

    let modelName = "gemini-1.5-flash";
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: reqBody
    });

    // Se o modelo padrão não for encontrado para esta chave, busca os modelos permitidos
    if (response.status === 404) {
      console.warn("[AI Service] Modelo padrão não encontrado. Buscando modelos disponíveis para esta chave...");
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const validModel = modelsData.models?.find((m: any) => 
          m.supportedGenerationMethods?.includes("generateContent") && 
          m.name.includes("gemini")
        );
        
        if (validModel) {
          modelName = validModel.name.replace("models/", "");
          console.log("[AI Service] Usando modelo alternativo descoberto:", modelName);
          url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reqBody
          });
        }
      }
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Erro na API do Gemini: " + err);
    }

    const geminiData = await response.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) throw new Error("Empty response from AI");

    const result = { text, source: "gemini" };
    setCachedResponse(cacheKey, result);
    return result;
  } catch (err: any) {
    console.warn("[AI Service] Gemini API call failed, using fallback:", err.message);
    const result = { text: generateLocalFallback(prompt), source: "fallback" };
    return result;
  }
}

/**
 * Detect intent from user input (for Copilot)
 * Uses advanced keyword mapping since classification via HF is deprecated.
 */
export async function detectIntent(
  userMessage: string
): Promise<{
  intent: "create_campaign" | "segment_clients" | "churn_risk" | "generate_message" | "dashboard_insights" | "general_question";
  confidence: number;
  source: string;
}> {
  const msg = userMessage.toLowerCase();

  if (msg.includes("campanha") || msg.includes("campaign") || msg.includes("criar")) {
    return { intent: "create_campaign", confidence: 0.9, source: "local_heuristic" };
  }
  if (msg.includes("segmen") || msg.includes("classificar") || msg.includes("agrupar")) {
    return { intent: "segment_clients", confidence: 0.9, source: "local_heuristic" };
  }
  if (msg.includes("risco") || msg.includes("churn") || msg.includes("inativo") || msg.includes("perdendo")) {
    return { intent: "churn_risk", confidence: 0.9, source: "local_heuristic" };
  }
  if (msg.includes("mensagem") || msg.includes("texto") || msg.includes("gerar") || msg.includes("escrever")) {
    return { intent: "generate_message", confidence: 0.9, source: "local_heuristic" };
  }
  if (msg.includes("dashboard") || msg.includes("insight") || msg.includes("resumo") || msg.includes("análise")) {
    return { intent: "dashboard_insights", confidence: 0.9, source: "local_heuristic" };
  }

  // Se for uma saudação simples, tratamos como pergunta geral (o copilot responderá saudando)
  if (msg === "oi" || msg === "olá" || msg === "ola" || msg.includes("bom dia") || msg.includes("boa tarde")) {
    return { intent: "general_question", confidence: 1.0, source: "local_heuristic" };
  }

  return { intent: "general_question", confidence: 0.5, source: "local_heuristic" };
}

export async function classifyText(text: string, labels: string[]): Promise<any> {
  // Deprecated: used local fallback mapping or Gemini in the future if needed
  return { labels, scores: labels.map(() => 0.5), source: "fallback" };
}

export async function summarizeText(text: string): Promise<any> {
  const cacheKey = `sum:${text.substring(0, 100)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.functions.invoke("generate-text", {
      body: { prompt: `Resuma o seguinte texto de forma concisa: ${text}`, platform: "Resumo", tone: "direto" }
    });
    
    if (error || data?.error) throw error || new Error(data?.error);
    
    const response = { summary: data.text, source: data.source };
    setCachedResponse(cacheKey, response);
    return response;
  } catch (err) {
    return { summary: text.substring(0, 150) + "...", source: "fallback" };
  }
}

// ─── Local Fallback Generator ────────────────────────────────────────────────

function generateLocalFallback(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("campanha") || lower.includes("marketing")) {
    return "🎯 Campanha sugerida: Reativação de clientes inativos com oferta exclusiva de 20% de desconto. Use tom empático e CTA direto.";
  }

  if (lower.includes("mensagem") || lower.includes("texto")) {
    return "Olá! 👋 Sentimos sua falta por aqui. Preparamos algo especial para você — uma oferta exclusiva que só nossos clientes mais valiosos têm acesso.";
  }

  if (lower.includes("segmenta") || lower.includes("classificar")) {
    return "📊 Segmentação sugerida: Divida sua base em VIP, Ativos, Inativos e Em Risco.";
  }

  if (lower.includes("churn") || lower.includes("risco")) {
    return "⚠️ Análise de churn: Clientes com mais de 30 dias sem interação têm alta probabilidade de abandono. Recomendo campanha de reativação.";
  }

  if (lower === "oi" || lower === "olá" || lower === "ola") {
    return "Olá! Como posso ajudar você a otimizar suas vendas e campanhas hoje?";
  }

  return "💡 Desculpe, não consegui conectar à API do Gemini no momento. Verifique sua chave nas configurações. Posso ajudar com análises do dashboard ou regras de automação locais.";
}

export function isHuggingFaceConfigured(): boolean {
  return false;
}

export function getAIServiceStatus(): any {
  return {
    configured: true,
    cacheSize: responseCache.size,
    callsLastMinute: 0,
    maxCallsPerMinute: 60,
  };
}

export function clearAICache(): void {
  responseCache.clear();
}
