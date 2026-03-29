
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
    console.log("=== SUPABASE AUDIT ===");
    try {
        const { count: userCount, error: userError } = await supabase.from('users').select('*', { count: 'exact', head: true });
        console.log("Users Table Count:", userCount, "Error:", userError ? userError.message : "None");

        const { count: clientsCount, error: clientsError } = await supabase.from('clients').select('*', { count: 'exact', head: true });
        console.log("Clients Table Count:", clientsCount, "Error:", clientsError ? clientsError.message : "None");

        const { data: triggerData, error: triggerError } = await supabase.rpc('get_dashboard_stats', { p_user_id: '117b04aa-fa1e-4c1d-aaae-c562dbfd201f' });
        console.log("RPC Test result:", triggerData, "Error:", triggerError ? triggerError.message : "None");

    } catch (e) {
        console.log("CATCH:", e.message);
    }
    process.exit(0);
}

check();
setTimeout(() => process.exit(0), 10000);
