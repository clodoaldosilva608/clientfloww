
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test_flow() {
  console.log("--- STARTING DATA FLOW LOG ---");
  
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
  console.log("STEP 1: Logged in as:", user.id);

  // 2. Insert Test Client
  const testName = "Debug Client " + Date.now();
  console.log(`STEP 2: Inserting client: ${testName}`);
  const { data: insertData, error: insertErr } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: testName,
      email: "debug@test.com"
    })
    .select()
    .single();

  if (insertErr) {
    console.error("Insert error:", insertErr.message);
  } else {
    console.log("SUCCESS: Client inserted with ID:", insertData.id);
    console.log("Returned row user_id:", insertData.user_id);
  }

  // 3. Fetch back
  console.log("STEP 3: Fetching back all clients for this user...");
  const { data: clients, error: fetchErr } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id);

  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
  } else {
    console.log(`Found ${clients.length} clients.`);
    clients.forEach(c => console.log(`- ${c.id}: ${c.name} (${c.user_id})`));
  }

  // 4. Try fetching WITHOUT explicit user_id filter (let RLS do it)
  console.log("STEP 4: Fetching back all clients WITHOUT explicit filter (RLS test)...");
  const { data: rlsClients, error: rlsErr } = await supabase
    .from('clients')
    .select('*');

  if (rlsErr) {
    console.error("RLS Fetch error:", rlsErr.message);
  } else {
    console.log(`RLS Found ${rlsClients.length} clients.`);
  }

  process.exit(0);
}

test_flow();
