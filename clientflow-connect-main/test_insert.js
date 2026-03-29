
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  console.log("Logged in as:", user.id);

  const { data, error } = await supabase.from('clients').insert({
    user_id: user.id,
    name: "SCRIPT TEST CLIENT",
    email: "test@script.com"
  }).select().single();

  if (error) {
    console.error("Insert error:", error.message);
  } else {
    console.log("Insert success:", data.id);
    
    const { data: fetched } = await supabase.from('clients').select('*').eq('id', data.id).single();
    console.log("Fetched immediately:", fetched?.name);
  }
}

test();
