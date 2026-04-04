import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const orgId = "4242543f-c9db-4399-aa33-d74ab75b1916";
  
  console.log(`Checking clients for org: ${orgId}`);
  const res = await supabase.from('clients').select('*').eq('organization_id', orgId);
  console.log(`Clients count for orgId: ${res.data ? res.data.length : 'null'}`);
  if (res.error) console.log('Error:', res.error);

  console.log(`Checking ALL clients across all orgs...`);
  const all = await supabase.from('clients').select('id, name, organization_id');
  console.log(`Total clients: ${all.data ? all.data.length : 'null'}`);
  if (all.data && all.data.length > 0) {
     console.log(`First client's org_id: ${all.data[0].organization_id}`);
  }
}
run();
