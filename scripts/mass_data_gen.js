
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
// Using the key found in test_flow.js
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateMassData() {
  console.log("🚀 Iniciando geração massiva de dados...");

  // 1. Auth
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  if (authErr) {
    console.error("❌ Erro na autenticação:", authErr.message);
    return;
  }

  const userId = authData.user.id;
  console.log("✅ Autenticado como:", userId);

  // 2. Geração de Clientes (Batch de 500 por vez para evitar timeouts)
  const totalClients = 5000;
  const batchSize = 500;
  
  console.log(`📦 Gerando ${totalClients} clientes em lotes de ${batchSize}...`);

  for (let i = 0; i < totalClients; i += batchSize) {
    const clientsBatch = Array.from({ length: batchSize }).map((_, idx) => ({
      user_id: userId,
      name: `Mass Test Client ${i + idx}`,
      email: `test_${i + idx}@example.com`,
      phone: `+55119${Math.floor(10000000 + Math.random() * 90000000)}`,
      notes: "Gerado automaticamente para teste massivo."
    }));

    const { error: clientErr } = await supabase
      .from('clients')
      .insert(clientsBatch);

    if (clientErr) {
      console.error(`❌ Erro no lote de clientes ${i}:`, clientErr.message);
    } else {
      console.log(`✅ Lote ${i / batchSize + 1}/${totalClients / batchSize} de clientes inserido.`);
    }
  }

  // 3. Geração de Logs de Mensagem
  const totalLogs = 10000;
  console.log(`📦 Gerando ${totalLogs} logs de mensagem...`);

  for (let i = 0; i < totalLogs; i += batchSize) {
    const logsBatch = Array.from({ length: batchSize }).map((_, idx) => ({
      user_id: userId,
      platform: ['whatsapp', 'telegram', 'instagram'][Math.floor(Math.random() * 3)],
      direction: 'outbound',
      message: "Mensagem de teste massivo para validação de performance.",
      status: 'sent',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { error: logErr } = await supabase
      .from('message_logs')
      .insert(logsBatch);

    if (logErr) {
      console.error(`❌ Erro no lote de logs ${i}:`, logErr.message);
    } else {
      console.log(`✅ Lote ${i / batchSize + 1}/${totalLogs / batchSize} de logs inserido.`);
    }
  }

  console.log("✨ Geração massiva concluída com sucesso!");
  process.exit(0);
}

generateMassData().catch(err => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
