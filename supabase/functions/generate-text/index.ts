import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, platform, tone } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    
    // Auth client to get user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Não autorizado");

    // Check for Hugging Face config
    const { data: hfConfig } = await supabaseClient
      .from("integration_configs")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "huggingface")
      .eq("is_active", true)
      .maybeSingle();

    const systemPrompt = `Você é um especialista em marketing digital especializado no mercado brasileiro.
Gere textos promocionais para "${platform || "WhatsApp/Redes Sociais"}".
Tom: ${tone || "vendedor e persuasivo"}.
Regras:
- Texto curto e impactante (máx 500 caracteres)
- Use emojis e CTA forte.
- Responda APENAS com o conteúdo da mensagem.`;

    // IF Hugging Face is configured, use it
    if (hfConfig && hfConfig.config?.api_token) {
      const model = hfConfig.config.model_id || "mistralai/Mistral-7B-Instruct-v0.2";
      const hfToken = hfConfig.config.api_token;

      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${systemPrompt}\n\nAssunto: ${prompt} [/INST]`,
          parameters: { max_new_tokens: 250, temperature: 0.7 }
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("HF Error:", err);
        throw new Error("Erro no Hugging Face: " + err);
      }

      const hfData = await response.json();
      let generatedText = "";
      
      if (Array.isArray(hfData)) {
        generatedText = hfData[0]?.generated_text || "";
      } else {
        generatedText = hfData.generated_text || "";
      }

      // Cleanup if model returns the prompt
      generatedText = generatedText.split("[/INST]").pop()?.trim() || generatedText;

      return new Response(JSON.stringify({ text: generatedText, source: "Hugging Face" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default AI Service fallback
    const AI_GATEWAY_KEY = Deno.env.get("INTERNAL_GATEWAY_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_KEY) throw new Error("Serviço de IA padrão não configurado");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error("Erro no serviço de IA padrão");

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: generatedText, source: "Default" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
