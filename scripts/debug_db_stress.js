
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  console.log("🔍 Debugging Supabase Request...");
  const { data, error } = await supabase.from('clients').select('id').limit(1);
  if (error) {
    console.error("❌ Error found:", error);
  } else {
    console.log("✅ Success:", data);
  }
}

debug();
