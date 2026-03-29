const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditSchema() {
  console.log("--- STARTING DATABASE AUDIT (PHASE 1) ---");

  // 1. List all tables
  const { data: tables, error: tableError } = await supabase.rpc('inspect_schema', { schema_name: 'public' });
  
  // If RPC doesn't exist, we'll try a raw query approach via a temporary function we might create if we had permission,
  // but since we only have public key, we can't create functions.
  // We'll rely on our knowledge and check common tables via standard queries.

  const targetTables = ['users', 'clients', 'tags', 'client_tags', 'campaigns', 'workflows', 'workflow_steps', 'message_logs', 'integration_configs'];
  
  for (const table of targetTables) {
    console.log(`\nAuditing table: ${table}`);
    const { data: columns, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
       if (error.code === '42P01') {
         console.log(`[MISSING] Table ${table} does not exist.`);
       } else {
         console.log(`[ERROR] Failed to query ${table}: ${error.message}`);
       }
       continue;
    }
    
    // Check for standard columns
    if (columns && columns.length >= 0) {
      const sample = columns[0] || {};
      const actualColumns = Object.keys(sample);
      console.log(`Columns found: ${actualColumns.join(', ')}`);
      
      const missing = [];
      if (!actualColumns.includes('id')) missing.push('id');
      if (!actualColumns.includes('created_at')) missing.push('created_at');
      if (!actualColumns.includes('updated_at')) missing.push('updated_at');
      if (!actualColumns.includes('organization_id')) missing.push('organization_id');
      
      if (missing.length > 0) {
        console.log(`[MISSING COLUMNS]: ${missing.join(', ')}`);
      } else {
        console.log(`[OK] All core columns present.`);
      }
    }
  }

  console.log("\n--- AUDIT COMPLETE ---");
}

auditSchema();
