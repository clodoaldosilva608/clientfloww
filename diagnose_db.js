
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function diagnose() {
  console.log("Starting diagnosis...");
  
  // 1. Sign in
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  const user = authData.user;
  console.log("Logged in as:", user.id, user.email);

  // 2. Check clients with user_id
  const { data: clients, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id);

  if (clientErr) console.error("Client fetch error:", clientErr);
  else console.log(`Found ${clients.length} clients for this user.`);

  // 3. Check ALL clients (just to see if user_id is different)
  const { data: allClients, error: allErr } = await supabase
    .from('clients')
    .select('id, user_id, name');

  if (allErr) console.error("All clients fetch error (likely RLS):", allErr);
  else {
    console.log(`Total clients visible: ${allClients.length}`);
    allClients.forEach(c => console.log(`- ${c.name}: ${c.user_id}`));
  }


  // 4. Check RPCs
  console.log("Checking get_dashboard_stats...");
  const { data: stats, error: rpcErr } = await supabase.rpc('get_dashboard_stats', { p_organization_id: "00000000-0000-0000-0000-000000000000" }); 
  if (rpcErr) console.warn("RPC Dashboard error (expected if org_id is dummy):", rpcErr);
  else console.log("Dashboard stats function exists.");

  console.log("Checking get_revenue_stats...");
  const { error: revErr } = await supabase.rpc('get_revenue_stats', { p_organization_id: "00000000-0000-0000-0000-000000000000" });
  if (revErr) console.warn("RPC Revenue error (expected if org_id is dummy):", revErr);
  else console.log("Revenue stats function exists.");

  // 5. Check subscriptions table structure
  const { data: subData, error: subErr } = await supabase.from('subscriptions').select('plan_id').limit(1);
  if (subErr) console.error("Subscription table structure error (missing plan_id?):", subErr);
  else console.log("Subscription table has plan_id.");
}

diagnose();
