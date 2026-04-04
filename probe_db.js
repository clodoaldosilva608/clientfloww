import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log('--- Table: campaigns ---');
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) {
    console.error('Error fetching campaigns:', error);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data in campaigns table to check columns.');
    // Try to get columns from information_schema if possible or just try common names
    const testCols = ['channel', 'platform', 'type'];
    for (const col of testCols) {
        const { error: colErr } = await supabase.from('campaigns').select(col).limit(1);
        if (!colErr) console.log(`Column '${col}' EXISTS`);
        else console.log(`Column '${col}' DOES NOT exist:`, colErr.message);
    }
  }

  console.log('\n--- Functions ---');
  const functions = ['get_dashboard_stats', 'get_user_stats'];
  for (const fn of functions) {
      const { error: fnErr1 } = await supabase.rpc(fn, { p_user_id: 'any' });
      console.log(`RPC ${fn}(p_user_id):`, fnErr1 ? `FAILED (${fnErr1.message})` : 'SUCCESS');
      
      const { error: fnErr2 } = await supabase.rpc(fn, { p_organization_id: 'any' });
      console.log(`RPC ${fn}(p_organization_id):`, fnErr2 ? `FAILED (${fnErr2.message})` : 'SUCCESS');
  }

  process.exit(0);
}

run();
