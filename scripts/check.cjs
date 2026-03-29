
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function check() {
    console.log("Checking...");
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        console.log("Result:", data, "Error:", error ? error.message : "None");
    } catch (e) {
        console.log("CATCH:", e.message);
    }
    process.exit(0);
}

check();
