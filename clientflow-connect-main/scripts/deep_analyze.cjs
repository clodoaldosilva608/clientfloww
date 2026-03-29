
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function analyze() {
    console.log("=== SUPABASE DEEP ANALYSIS ===");
    const tables = ['users', 'profiles', 'clients', 'campaigns', 'message_logs', 'integration_configs', 'workflows', 'workflow_steps', 'flows', 'flow_steps'];
    
    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`  ERROR: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`  COLUMNS: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log(`  Table exists but empty.`);
        }
    }

    console.log("\n--- Checking RPCs ---");
    const { data: rpc1, error: rpcErr1 } = await supabase.rpc('get_dashboard_stats');
    console.log(`RPC: get_dashboard_stats() -> ${rpcErr1 ? "ERROR: " + rpcErr1.message : "SUCCESS (No Params)"}`);

    const { data: rpc2, error: rpcErr2 } = await supabase.rpc('get_dashboard_stats', { p_user_id: '117b04aa-fa1e-4c1d-aaae-c562dbfd201f' });
    console.log(`RPC: get_dashboard_stats(p_user_id) -> ${rpcErr2 ? "ERROR: " + rpcErr2.message : "SUCCESS (With Param)"}`);

    process.exit(0);
}

analyze();
setTimeout(() => process.exit(0), 10000);
