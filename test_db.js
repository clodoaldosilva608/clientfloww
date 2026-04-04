require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  console.log('Testing campaigns...');
  const res = await supabase.from('campaigns').select('*').limit(1);
  if (res.data && res.data.length > 0) {
    console.log('campaigns columns:', Object.keys(res.data[0]));
  } else {
    // try to insert an empty row to see the error or use a failing insert to see strictly the error
    const res2 = await supabase.from('campaigns').insert({ name: 'test', message: 'test', user_id: 'test', platform: 'whatsapp' });
    console.log('insert error:', res2.error);
  }

  // Also let's check what functions we have
  const res3 = await supabase.rpc('get_dashboard_stats', { p_user_id: 'test' });
  console.log('get_dashboard_stats(p_user_id) error:', res3.error);

  const res4 = await supabase.rpc('get_dashboard_stats', {});
  console.log('get_dashboard_stats() error:', res4.error);

  process.exit(0);
}
run();
