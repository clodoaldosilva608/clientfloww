
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function diagnose() {
  console.log("Starting diagnosis script...");
  
  try {
    // 1. Sign in
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: "clodoaldo608@gmail.com",
      password: "88677488"
    });

    if (authErr) {
      console.error("Auth error:", authErr.message);
      return;
    }

    const user = authData.user;
    console.log("SUCCESS: Logged in as:", user.id);

    // 2. Check clients
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id);

    if (clientErr) console.error("Client fetch error:", clientErr.message);
    else console.log(`SUCCESS: Found ${clients.length} clients in public.clients for this user.`);

    // 3. Check if any clients exist at all (might be RLS blocked)
    const { data: countData, error: countErr } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true });
    
    console.log("Total visible clients count:", countData ? countData.length : 0);

    // 4. Check RPC
    const { data: stats, error: rpcErr } = await supabase.rpc('get_dashboard_stats', { p_user_id: user.id });
    if (rpcErr) console.error("RPC error:", rpcErr.message);
    else console.log("SUCCESS: Dashboard stats RPC returned:", stats);

    console.log("Diagnosis complete.");
  } catch (err) {
    console.error("Fatal error during diagnosis:", err);
  }
}

diagnose();
