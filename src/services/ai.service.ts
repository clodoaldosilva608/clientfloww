/**
 * src/services/ai.service.ts
 * Phase 1 — Hugging Face AI Service
 *
 * Connects to Hugging Face Inference API for real AI capabilities:
 * - Text generation (Mistral-7B / flan-t5-large)
 * - Text classification (BART-large-MNLI)  
 * - Text summarization
 *
 * Falls back to local template when HF is unavailable.
 */

const HF_API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? "/api/hf" 
  : "https://api-inference.huggingface.co";

// Models configuration
const MODELS = {
  textGeneration: "mistralai/Mistral-7B-Instruct-v0.2",
  textGenerationFallback: "google/flan-t5-large",
  classification: "facebook/bart-large-mnli",
  summarization: "facebook/bart-large-cnn",
} as const;

// Get HF token from env (Vite exposes VITE_ prefixed vars)
function getHFToken(): string {
  return (import.meta as any).env?.VITE_HF_TOKEN || "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";
}

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
  // Limit cache size
  if (responseCache.size > 100) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

// ─── Rate Limiter ───────────────────────────────────────────────────────────
const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 20;

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  // Remove old timestamps
  while (callTimestamps.length > 0 && callTimestamps[0] < oneMinuteAgo) {
    callTimestamps.shift();
  }
  return callTimestamps.length < MAX_CALLS_PER_MINUTE;
}

function recordCall(): void {
  callTimestamps.push(Date.now());
}

// ─── Core API Caller ────────────────────────────────────────────────────────

interface HFRequestOptions {
  model?: string;
  path?: string;
  payload: Record<string, any>;
  retries?: number;
}

async function callHuggingFace(options: HFRequestOptions): Promise<any> {
  const { model, payload, retries = 2 } = options;
  const token = getHFToken();

  if (!token) {
    throw new Error("HF_TOKEN not configured. Set VITE_HF_TOKEN in .env");
  }

  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Try again in a minute.");
  }

  recordCall();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const isProxy = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      let url = "";
      if (isProxy) {
        if (options.path) url = `${HF_API_BASE}?path=${encodeURIComponent(options.path)}`;
        else url = `${HF_API_BASE}?model=${encodeURIComponent(model || options.payload.model)}`;
      } else {
        if (options.path) url = `${HF_API_BASE}/models/${options.payload.model || model}/${options.path}`;
        else url = `${HF_API_BASE}/models/${model || options.payload.model}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 503) {
        // Model is loading — wait and retry
        const body = await response.json().catch(() => ({}));
        const waitTime = body.estimated_time ? Math.min(body.estimated_time * 1000, 30000) : 10000;
        console.warn(`[AI Service] Model ${model} is loading. Waiting ${waitTime}ms...`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`HF API error ${response.status}: ${errorBody}`);
      }

      return await response.json();
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`[AI Service] Attempt ${attempt + 1} failed:`, error.message);
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate text using Mistral-7B-Instruct or flan-t5-large
 */
export async function generateText(prompt: string): Promise<{ text: string; source: "huggingface" | "fallback" }> {
  const cacheKey = `gen:${prompt.substring(0, 100)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const result = await callHuggingFace({
      path: "v1/chat/completions",
      payload: {
        model: MODELS.textGeneration,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      },
    });

    const text = result.choices?.[0]?.message?.content?.trim() || 
                 (typeof result === "string" ? result : JSON.stringify(result));

    const response = { text, source: "huggingface" as const };
    setCachedResponse(cacheKey, response);
    return response;
  } catch (primaryError: any) {
    console.warn("[AI Service] Primary model failed, trying fallback:", primaryError.message);

    try {
      // Fallback to flan-t5
      const result = await callHuggingFace({
        model: MODELS.textGenerationFallback,
        payload: {
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
          },
        },
      });

      const text = Array.isArray(result) && result[0]?.generated_text
        ? result[0].generated_text.trim()
        : typeof result === "string" ? result : "";

      const response = { text, source: "huggingface" as const };
      setCachedResponse(cacheKey, response);
      return response;
    } catch {
      // Final fallback: local generation
      return { text: generateLocalFallback(prompt), source: "fallback" };
    }
  }
}

/**
 * Classify text using Facebook BART-large-MNLI (zero-shot)
 */
export async function classifyText(
  text: string, 
  candidateLabels: string[] = ["urgente", "informativo", "promocional", "suporte", "reclamação"]
): Promise<{ labels: string[]; scores: number[]; source: "huggingface" | "fallback" }> {
  const cacheKey = `cls:${text.substring(0, 80)}:${candidateLabels.join(",")}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const result = await callHuggingFace({
      model: MODELS.classification,
      payload: {
        inputs: text,
        parameters: {
          candidate_labels: candidateLabels,
        },
      },
    });

    const response = {
      labels: result.labels || candidateLabels,
      scores: result.scores || candidateLabels.map(() => 0),
      source: "huggingface" as const,
    };
    setCachedResponse(cacheKey, response);
    return response;
  } catch (error: any) {
    console.warn("[AI Service] Classification failed:", error.message);
    return {
      labels: candidateLabels,
      scores: candidateLabels.map((_, i) => i === 0 ? 0.5 : 0.1),
      source: "fallback",
    };
  }
}

/**
 * Summarize text using BART-large-CNN
 */
export async function summarizeText(text: string): Promise<{ summary: string; source: "huggingface" | "fallback" }> {
  const cacheKey = `sum:${text.substring(0, 100)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const result = await callHuggingFace({
      model: MODELS.summarization,
      payload: {
        inputs: text,
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false,
        },
      },
    });

    const summary = Array.isArray(result) && result[0]?.summary_text
      ? result[0].summary_text
      : "Sem resumo disponível.";

    const response = { summary, source: "huggingface" as const };
    setCachedResponse(cacheKey, response);
    return response;
  } catch (error: any) {
    console.warn("[AI Service] Summarization failed:", error.message);
    return {
      summary: text.length > 200 ? text.substring(0, 197) + "..." : text,
      source: "fallback",
    };
  }
}

/**
 * Detect intent from user input (for Copilot)
 */
export async function detectIntent(
  userMessage: string
): Promise<{
  intent: "create_campaign" | "segment_clients" | "churn_risk" | "generate_message" | "dashboard_insights" | "general_question";
  confidence: number;
  source: "huggingface" | "fallback";
}> {
  const intents = [
    "criar campanha",
    "segmentar clientes",
    "clientes em risco de churn",
    "gerar mensagem promocional",
    "insights do dashboard",
    "pergunta geral",
  ];

  try {
    const result = await classifyText(userMessage, intents);
    
    const intentMap: Record<string, "create_campaign" | "segment_clients" | "churn_risk" | "generate_message" | "dashboard_insights" | "general_question"> = {
      "criar campanha": "create_campaign",
      "segmentar clientes": "segment_clients",
      "clientes em risco de churn": "churn_risk",
      "gerar mensagem promocional": "generate_message",
      "insights do dashboard": "dashboard_insights",
      "pergunta geral": "general_question",
    };

    const topLabel = result.labels[0];
    const topScore = result.scores[0];

    // Se a confiança for muito baixa ou indefinida, assume que é uma pergunta geral (evita auto-execução acidental)
    if (topScore === undefined || topScore < 0.3) {
      return {
        intent: "general_question",
        confidence: topScore || 0,
        source: result.source,
      };
    }

    return {
      intent: intentMap[topLabel] || "general_question",
      confidence: topScore,
      source: result.source,
    };
  } catch {
    // Local keyword-based fallback
    const msg = userMessage.toLowerCase();

    if (msg.includes("campanha") || msg.includes("campaign") || msg.includes("criar")) {
      return { intent: "create_campaign", confidence: 0.8, source: "fallback" };
    }
    if (msg.includes("segmen") || msg.includes("classificar") || msg.includes("agrupar")) {
      return { intent: "segment_clients", confidence: 0.8, source: "fallback" };
    }
    if (msg.includes("risco") || msg.includes("churn") || msg.includes("inativo") || msg.includes("perdendo")) {
      return { intent: "churn_risk", confidence: 0.8, source: "fallback" };
    }
    if (msg.includes("mensagem") || msg.includes("texto") || msg.includes("gerar") || msg.includes("escrever")) {
      return { intent: "generate_message", confidence: 0.8, source: "fallback" };
    }
    if (msg.includes("dashboard") || msg.includes("insight") || msg.includes("resumo") || msg.includes("análise")) {
      return { intent: "dashboard_insights", confidence: 0.8, source: "fallback" };
    }

    return { intent: "general_question", confidence: 0.5, source: "fallback" };
  }
}

// ─── Local Fallback Generator ────────────────────────────────────────────────

function generateLocalFallback(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("campanha") || lower.includes("marketing")) {
    return "🎯 Campanha sugerida: Reativação de clientes inativos com oferta exclusiva de 20% de desconto. Use tom empático e CTA direto. Envie via WhatsApp no horário de pico (18h-20h) para maximizar engajamento.";
  }

  if (lower.includes("mensagem") || lower.includes("texto")) {
    return "Olá! 👋 Sentimos sua falta por aqui. Preparamos algo especial para você — uma oferta exclusiva que só nossos clientes mais valiosos têm acesso. Não perca essa oportunidade! Responda agora.";
  }

  if (lower.includes("segmenta") || lower.includes("classificar")) {
    return "📊 Segmentação sugerida: Divida sua base em 4 grupos — VIP (score >80), Ativos (50-80), Inativos (<50), e Em Risco (churn >70%). Crie campanhas específicas para cada segmento.";
  }

  if (lower.includes("churn") || lower.includes("risco")) {
    return "⚠️ Análise de churn: Clientes com mais de 30 dias sem interação têm 3x mais probabilidade de abandono. Recomendo campanha de reativação urgente com oferta personalizada.";
  }

  return "💡 Baseado na análise dos dados, recomendo focar em engajamento personalizado por segmento. Use automações para manter contato regular e identifique oportunidades de upsell com clientes VIP.";
}

// ─── Utility: Check if HF is configured ─────────────────────────────────────

export function isHuggingFaceConfigured(): boolean {
  return !!getHFToken();
}

export function getAIServiceStatus(): {
  configured: boolean;
  cacheSize: number;
  callsLastMinute: number;
  maxCallsPerMinute: number;
} {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentCalls = callTimestamps.filter(t => t > oneMinuteAgo).length;

  return {
    configured: isHuggingFaceConfigured(),
    cacheSize: responseCache.size,
    callsLastMinute: recentCalls,
    maxCallsPerMinute: MAX_CALLS_PER_MINUTE,
  };
}

export function clearAICache(): void {
  responseCache.clear();
}
