const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcxnmzoinugkhuexdgjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Signing in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in as:", userId);

  // 1. Insert 10 Clients
  console.log("Inserting 10 clients...");
  const clients = Array.from({ length: 10 }).map((_, i) => ({
    name: `Audit Client ${i + 1}`,
    email: `audit${i + 1}@example.com`,
    phone: `119888877${i.toString().padStart(2, '0')}`,
    user_id: userId
  }));

  const { data: insertedClients, error: cErr } = await supabase.from('clients').insert(clients).select();
  if (cErr) console.error("Client Error:", cErr);

  // 2. Insert 3 Campaigns
  console.log("Inserting 3 campaigns...");
  const campaigns = [
    { name: "Audit Q1 Promo", message: "Special offer for you!", platform: "whatsapp", status: "sent", user_id: userId },
    { name: "Audit Welcome", message: "Welcome to ClientFlow!", platform: "telegram", status: "active", user_id: userId },
    { name: "Audit Re-engagement", message: "Long time no see!", platform: "instagram", status: "draft", user_id: userId }
  ];

  const { data: insertedCampaigns, error: campErr } = await supabase.from('campaigns').insert(campaigns).select();
  if (campErr) console.error("Campaign Error:", campErr);

  // 3. Insert 20 Messages
  if (insertedClients) {
    console.log("Inserting 20 messages...");
    const statuses = ['sent', 'delivered', 'read', 'failed'];
    const messages = Array.from({ length: 20 }).map((_, i) => ({
      user_id: userId,
      client_id: insertedClients[i % 10].id,
      campaign_id: insertedCampaigns ? insertedCampaigns[i % 3].id : null,
      message: `Audit Test Message ${i+1}`,
      platform: "whatsapp",
      direction: "outbound",
      status: statuses[i % 4]
    }));
    const { error: mErr } = await supabase.from('message_logs').insert(messages);
    if (mErr) console.error("Message Error:", mErr);
  }

  // 4. Insert 2 Workflows
  console.log("Inserting 2 workflows...");
  const workflows = [
    { name: "Audit Flow Alpha", status: "active", user_id: userId },
    { name: "Audit Flow Beta", status: "draft", user_id: userId }
  ];
  const { data: insertedWorkflows, error: wErr } = await supabase.from('workflows').insert(workflows).select();
  if (wErr) console.error("Workflow Error:", wErr);

  // 5. Insert 10 steps
  if (insertedWorkflows) {
    console.log("Inserting 10 workflow steps...");
    const steps = [
      { workflow_id: insertedWorkflows[0].id, step_order: 1, step_type: 'wait', config: { delay: '5m' } },
      { workflow_id: insertedWorkflows[0].id, step_order: 2, step_type: 'send_message', config: { template: 'hello' } },
      { workflow_id: insertedWorkflows[0].id, step_order: 3, step_type: 'add_tag', config: { tag: 'audit_passed' } },
      { workflow_id: insertedWorkflows[1].id, step_order: 1, step_type: 'send_message', config: { template: 'test' } }
    ];
    const { error: sErr } = await supabase.from('workflow_steps').insert(steps);
    if (sErr) console.error("Step Error:", sErr);
  }

  console.log("✅ Audit Data Seeded Successfully!");
}

seed();
