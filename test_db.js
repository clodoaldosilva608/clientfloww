require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  console.log('Testing integration_configs...');
  const res = await supabase.from('integration_configs').select('*').limit(1);
  console.log('integration_configs error:', res.error);
  if (res.data) console.log('integration_configs keys:', Object.keys(res.data[0] || {}));

  console.log('Testing subscriptions plan...');
  const res2 = await supabase.from('subscriptions').select('*, plan:plans(*)').limit(1);
  console.log('subscriptions error:', res2.error);
  if (res2.data) console.log('subscriptions data:', res2.data);
  
  process.exit(0);
}
run();
