/**
 * src/ai/message-generator.ts
 * Phase 7 — AI Message Generator
 *
 * Generates campaign messages using:
 * 1. Smart template interpolation (always available, no API key needed)
 * 2. OpenAI API via Supabase Edge Function (optional, if configured)
 */

export type MessageTone = "formal" | "casual" | "urgente" | "empatico" | "vendas";
export type MessageGoal = "reativacao" | "vip" | "oferta" | "lembrete" | "agradecimento" | "follow_up";

export interface MessageGenParams {
  goal: MessageGoal;
  tone: MessageTone;
  clientName?: string;
  businessName?: string;
  offerDetails?: string;
  platform: "whatsapp" | "telegram" | "instagram";
}

// ─── Template Library ───────────────────────────────────────────────────────

const TEMPLATES: Record<MessageGoal, Record<MessageTone, string[]>> = {
  reativacao: {
    formal: [
      "Prezado(a) {clientName}, sentimos sua falta. Gostaríamos de retomar nosso contato e apresentar novidades exclusivas para você.",
      "Olá {clientName}, percebemos que faz um tempo desde o nosso último contato. Temos algo especial para te apresentar.",
    ],
    casual: [
      "Oi {clientName}! Sumiu! 😄 Passando aqui para ver se você tá bem e te contar que temos novidades incríveis te esperando!",
      "E aí, {clientName}? Saudades! 👋 A gente tava com saudade de você e trouxe uma novidade especial.",
    ],
    urgente: [
      "🚨 {clientName}, ÚLTIMA CHANCE! Sua oferta exclusiva expira em 48h. Não perca essa oportunidade!",
      "⚡ {clientName}! Estoque limitado! Recupere seus benefícios AGORA antes que acabem.",
    ],
    empatico: [
      "Oi {clientName}, esperamos que esteja tudo bem! Estávamos pensando em você e queríamos saber se podemos ajudar em algo.",
      "{clientName}, sabemos que a vida é corrida. Por isso, trouxemos uma novidade que vai facilitar seu dia.",
    ],
    vendas: [
      "🎯 {clientName}, temos uma oportunidade EXCLUSIVA para clientes como você. Retorne e garanta desconto especial!",
      "💰 {clientName}! Clientes que voltam ganham condições especiais. Aproveite agora!",
    ],
  },
  vip: {
    formal: [
      "Prezado(a) {clientName}, você é um de nossos clientes mais especiais. Preparamos uma oferta exclusiva VIP só para você.",
    ],
    casual: [
      "Oi {clientName}! Você é VIP aqui e merece o melhor! 👑 Olha o que preparamos só pra você...",
    ],
    urgente: [
      "🌟 {clientName}, acesso VIP antecipado disponível por apenas 24h! Você foi um dos primeiros selecionados.",
    ],
    empatico: [
      "Você é muito especial para nós, {clientName}! Por isso, separamos algo apenas para nossos clientes mais fidelizados.",
    ],
    vendas: [
      "👑 {clientName}, como nosso cliente VIP, você tem acesso a preços e condições que ninguém mais tem. Veja aqui.",
    ],
  },
  oferta: {
    formal: [
      "Prezado(a) {clientName}, temos o prazer de apresentar uma oferta especial: {offerDetails}. Válido por tempo limitado.",
    ],
    casual: [
      "Ei {clientName}! Que tal isso? 🎉 {offerDetails} — Corre que é por tempo limitado!",
    ],
    urgente: [
      "⏰ {clientName}, QUEIMA DE ESTOQUE! {offerDetails}. Só até AMANHÃ! Responda AGORA.",
    ],
    empatico: [
      "{clientName}, pensando em você, preparamos: {offerDetails}. Esperamos que goste!",
    ],
    vendas: [
      "💥 OFERTA IMPERDÍVEL para você, {clientName}! {offerDetails} — Garanta já a sua vaga.",
    ],
  },
  lembrete: {
    formal: [
      "Prezado(a) {clientName}, esta é uma lembrança amigável sobre seu agendamento/pendência conosco.",
    ],
    casual: [
      "Oi {clientName}! Só passando para lembrar que você tem algo pendente aqui com a gente. 😊",
    ],
    urgente: [
      "⚠️ {clientName}, ATENÇÃO: Você tem uma pendência importante que vence em breve!",
    ],
    empatico: [
      "Oi {clientName}, sei que é muita coisa para lembrar no dia a dia. Passando para te avisar sobre uma pendência.",
    ],
    vendas: [
      "🔔 {clientName}, não esqueça! Sua oferta reservada expira em breve. Não perca!",
    ],
  },
  agradecimento: {
    formal: [
      "Prezado(a) {clientName}, agradecemos imensamente a sua confiança e preferência.",
    ],
    casual: [
      "Oi {clientName}! Muito obrigado pela confiança! Você é demais! 🙏❤️",
    ],
    urgente: [
      "OBRIGADO {clientName}! Como agradecimento especial, liberamos um bônus surpresa para você!",
    ],
    empatico: [
      "{clientName}, sua confiança significa muito para nós. De coração, muito obrigado! 🤝",
    ],
    vendas: [
      "Obrigado, {clientName}! Como cliente especial, você ganhou créditos para sua próxima compra!",
    ],
  },
  follow_up: {
    formal: [
      "Prezado(a) {clientName}, dando seguimento à nossa conversa anterior, gostaríamos de saber se podemos auxiliá-lo(a).",
    ],
    casual: [
      "Oi {clientName}! Passando para ver se você teve a chance de pensar na nossa proposta. Posso ajudar com algo? 😊",
    ],
    urgente: [
      "⚡ {clientName}, sua proposta ainda está aguardando! Precisamos de uma resposta em 24h.",
    ],
    empatico: [
      "{clientName}, sem pressão! Só queria saber se ficou alguma dúvida da nossa última conversa. Estou aqui para ajudar!",
    ],
    vendas: [
      "🎯 {clientName}, sua oportunidade ainda está esperando por você! Vamos fechar isso hoje?",
    ],
  },
};

// ─── Platform Formatters ─────────────────────────────────────────────────────

function formatForPlatform(message: string, platform: string): string {
  if (platform === "instagram") {
    // Instagram prefers shorter messages
    return message.length > 200 ? message.substring(0, 197) + "..." : message;
  }
  return message;
}

// ─── Template Interpolation ─────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value || key);
  }
  return result;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a message using local templates (always works, no API key needed).
 */
export function generateMessageFromTemplate(params: MessageGenParams): string {
  const toneTemplates = TEMPLATES[params.goal]?.[params.tone] ?? TEMPLATES.reativacao.casual;
  const template = toneTemplates[Math.floor(Math.random() * toneTemplates.length)];

  const vars: Record<string, string> = {
    clientName: params.clientName || "cliente",
    businessName: params.businessName || "nossa empresa",
    offerDetails: params.offerDetails || "oferta especial",
  };

  const message = interpolate(template, vars);
  return formatForPlatform(message, params.platform);
}

/**
 * Generate a message via Supabase Edge Function + OpenAI (optional).
 * Falls back to template if the Edge Function fails.
 */
export async function generateMessageWithAI(
  params: MessageGenParams,
  supabase: any
): Promise<{ message: string; source: "ai" | "template" }> {
  try {
    const prompt = buildAIPrompt(params);
    const { data, error } = await supabase.functions.invoke("generate-text", {
      body: { prompt, platform: params.platform, tone: params.tone },
    });

    if (error || !data?.text) throw new Error("AI unavailable");

    return { message: data.text, source: "ai" };
  } catch {
    // Graceful fallback to template
    return {
      message: generateMessageFromTemplate(params),
      source: "template",
    };
  }
}

function buildAIPrompt(params: MessageGenParams): string {
  const goalLabels: Record<MessageGoal, string> = {
    reativacao: "reativação de cliente inativo",
    vip: "cliente VIP exclusivo",
    oferta: "oferta especial",
    lembrete: "lembrete de pendência",
    agradecimento: "agradecimento de fidelidade",
    follow_up: "acompanhamento pós-conversa",
  };

  const toneLabels: Record<MessageTone, string> = {
    formal: "formal e profissional",
    casual: "casual e amigável",
    urgente: "urgente e persuasivo",
    empatico: "empático e humano",
    vendas: "focado em conversão e vendas",
  };

  return [
    `Crie uma mensagem de ${goalLabels[params.goal]} no tom ${toneLabels[params.tone]}.`,
    params.clientName ? `O cliente se chama ${params.clientName}.` : "",
    params.offerDetails ? `Detalhes da oferta: ${params.offerDetails}.` : "",
    `A mensagem será enviada via ${params.platform}.`,
    "Seja direto, use emojis com moderação, máximo 3 frases.",
  ]
    .filter(Boolean)
    .join(" ");
}
