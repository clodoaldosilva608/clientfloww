import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
// Using the key found in test_flow.js
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupMassData() {
  console.log("🧹 Iniciando limpeza de dados massivos...");

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

  // 2. Apagar todos os message_logs do usuário
  console.log("🗑️ Apagando logs de mensagens...");
  const { error: logsErr } = await supabase
    .from('message_logs')
    .delete()
    .eq('user_id', userId);

  if (logsErr) {
    console.error("❌ Erro ao apagar logs:", logsErr.message);
  } else {
    console.log("✅ Logs apagados com sucesso.");
  }

  // 3. Buscar os 3 clientes mais recentes para não apagá-los
  console.log("🔍 Buscando os 3 clientes mais recentes...");
  const { data: clientsToKeep, error: fetchErr } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (fetchErr) {
    console.error("❌ Erro ao buscar clientes:", fetchErr.message);
    return;
  }

  const idsToKeep = clientsToKeep.map(c => c.id);
  console.log(`✅ Preservando os clientes com IDs: ${idsToKeep.join(', ')}`);

  // 4. Apagar todos os outros clientes
  console.log("🗑️ Apagando clientes restantes...");
  
  // Como a API não suporta .not('id', 'in', array) de forma trivial em deletes sem cuidado, 
  // faremos uma deleção onde id NOT IN (...)
  if (idsToKeep.length > 0) {
    const keepIdsString = `(${idsToKeep.map(id => `"${id}"`).join(',')})`;
    const { error: delErr } = await supabase
      .from('clients')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', keepIdsString);

    if (delErr) {
      console.error("❌ Erro ao apagar clientes:", delErr.message);
    } else {
      console.log("✅ Limpeza de clientes concluída.");
    }
  } else {
    // Se não tinha clientes, apenas apaga tudo (o que daria 0)
    await supabase.from('clients').delete().eq('user_id', userId);
    console.log("✅ Nenhum cliente para preservar. Todos apagados.");
  }

  console.log("✨ Processo de limpeza concluído!");
  process.exit(0);
}

cleanupMassData().catch(err => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
