const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";
const supabase = createClient(SUPABASE_URL, KEY);

async function probe() {
    console.log("Probing campaigns table...");
    const { data, error } = await supabase.from('campaigns').select('*').limit(1);
    if (error) {
        console.log("Error selecting from campaigns:", error.message);
    } else if (data && data.length > 0) {
        console.log("Real columns in campaigns:", Object.keys(data[0]));
    } else {
        console.log("Campaigns table is empty, trying to probe columns one by one...");
        const cols = ['platform', 'channel', 'provider', 'medium', 'target_platform'];
        for (const c of cols) {
            const { error: e } = await supabase.from('campaigns').select(c).limit(1);
            if (!e) console.log(`Column '${c}' EXISTS`);
            else console.log(`Column '${c}' MISSING:`, e.message);
        }
    }
    
    console.log("\nProbing get_dashboard_stats...");
    const { data: d2, error: e2 } = await supabase.rpc('get_dashboard_stats', { p_user_id: 'any' });
    console.log("With p_user_id:", e2 ? e2.message : "Success");
    
    const { data: d3, error: e3 } = await supabase.rpc('get_dashboard_stats', { p_organization_id: 'any' });
    console.log("With p_organization_id:", e3 ? e3.message : "Success");

    process.exit(0);
}
probe();
