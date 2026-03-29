
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, KEY);

async function inspect() {
    console.log("=== SUPABASE INSPECTION ===");

    // 1. Check Function
    console.log("\n--- Checking get_dashboard_stats RPC ---");
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_dashboard_stats');
    if (rpcErr) {
        console.error("RPC Error (no params):", rpcErr.message);
        console.log("Attempting with dummy p_user_id param...");
        const { error: rpcErrWithParam } = await supabase.rpc('get_dashboard_stats', { p_user_id: '00000000-0000-0000-0000-000000000000' });
        if (rpcErrWithParam) console.error("RPC Error (with param):", rpcErrWithParam.message);
        else console.log("SUCCESS: Function exists but expects p_user_id parameter.");
    } else {
        console.log("SUCCESS: Function exists and works without parameters.");
        console.log("Data returned:", rpcData);
    }

    // 2. Check Tables and Columns
    const tables = ['clients', 'campaigns', 'message_logs', 'profiles', 'integration_configs', 'workflows', 'organizations'];
    console.log("\n--- Checking Tables ---");
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Table '${table}': ERROR - ${error.message}`);
        } else {
            console.log(`Table '${table}': SUCCESS (${data.length} rows found)`);
            if (data.length > 0) {
                console.log(`  Columns found: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }

    process.exit(0);
}

inspect();
