
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync('debug_output.txt', msg + '\n');
};

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test_flow() {
  log("--- STARTING DATA FLOW LOG ---");
  
  try {
    // 1. Sign in
    log("Logging in...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: "clodoaldo608@gmail.com",
      password: "88677488"
    });

    if (authErr) {
      log("Auth error: " + authErr.message);
      return;
    }

    const user = authData.user;
    log("Logged in as: " + user.id);

    // 2. Clear debug file if needed
    // 3. Select all clients
    log("Fetching clients...");
    const { data: clients, error: fetchErr } = await supabase
      .from('clients')
      .select('*');

    if (fetchErr) {
      log("Fetch error: " + fetchErr.message);
    } else {
      log(`Found ${clients.length} clients.`);
      clients.forEach(c => log(`- ${c.id}: ${c.name} (${c.user_id})`));
    }

    // 4. Insert dummy
    const dummyName = "Script Test " + Date.now();
    log("Inserting dummy: " + dummyName);
    const { data: ins, error: insErr } = await supabase.from('clients').insert({ name: dummyName, user_id: user.id }).select().single();
    if (insErr) log("Insert error: " + insErr.message);
    else log("Inserted SUCCESS: " + ins.id);

    log("DONE");
  } catch (e) {
    log("FATAL: " + e.message);
  }
  process.exit(0);
}

test_flow();
