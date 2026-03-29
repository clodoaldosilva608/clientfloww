
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check_rpc() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  console.log("Logged in as:", user.id);

  console.log("Testing RPC without parameters...");
  const { data: stats1, error: err1 } = await supabase.rpc('get_dashboard_stats');
  if (err1) console.error("RPC Error (no params):", err1.message);
  else console.log("RPC Success (no params):", stats1);

  console.log("Testing RPC with p_user_id parameters...");
  const { data: stats2, error: err2 } = await supabase.rpc('get_dashboard_stats', { p_user_id: user.id });
  if (err2) console.error("RPC Error (with params):", err2.message);
  else console.log("RPC Success (with params):", stats2);

  process.exit(0);
}

check_rpc();
