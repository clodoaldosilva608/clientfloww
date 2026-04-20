
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";
const HF_TOKEN = "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";
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function stressTest() {
  console.log("🔥 Iniciando Teste de Estresse de API e Integrações...");

  // 0. Auth (Obrigatório para contornar RLS)
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  if (authErr) {
    console.error("❌ Erro na autenticação:", authErr.message);
    return;
  }
  console.log("✅ Autenticado com sucesso.");

  // 1. Stress de Banco de Dados (Leituras simultâneas)
  console.log("📊 Testando concorrência de leitura no Supabase...");
  const dbStartTime = Date.now();
  const dbRequests = Array.from({ length: 50 }).map(() => 
    supabase.from('clients').select('id').limit(100)
  );

  const dbResults = await Promise.all(dbRequests);
  const dbEndTime = Date.now();
  const dbErrors = dbResults.filter(r => r.error).length;
  console.log(`⏱️ DB: 50 requisições paralelas concluídas em ${dbEndTime - dbStartTime}ms. Erros: ${dbErrors}`);

  // 2. Stress de IA (Hugging Face)
  console.log("🤖 Testando concorrência na API do Hugging Face...");
  const hfStartTime = Date.now();
  
  const hfRequests = Array.from({ length: 10 }).map(async (_, i) => {
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: `Explique o conceito de CRM em uma frase curta. ID:${i}` }),
      });
      return { status: res.status, ok: res.ok };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  const hfResults = await Promise.all(hfRequests);
  const hfEndTime = Date.now();
  const hfErrors = hfResults.filter(r => !r.ok).length;
  console.log(`⏱️ IA: 10 requisições paralelas concluídas em ${hfEndTime - hfStartTime}ms. Erros/Rate-limits: ${hfErrors}`);

  console.log("🏁 Teste de estresse básico finalizado.");
  process.exit(0);
}

stressTest().catch(console.error);
