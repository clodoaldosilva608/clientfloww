import { supabase } from "./lib/supabase";
import { authService } from "./services/auth.service";

async function seed() {
  console.log("Starting seed...");
  
  // 1. Sign in
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: "clodoaldo608@gmail.com",
    password: "88677488"
  });

  if (signInErr) {
    console.error("Sign in error:", signInErr);
    return;
  }

  // 1. Get current user
  const { data: { user } } = await authService.getUser();
  if (!user) {
    console.error("No user logged in. Please log in first.");
    return;
  }

  const userId = user.id;

  // 2. Create 10 Clients
  const clients = Array.from({ length: 10 }).map((_, i) => ({
    name: `Client ${i + 1}`,
    email: `client${i + 1}@example.com`,
    phone: `119999900${(i + 1).toString().padStart(2, '0')}`,
    user_id: userId
  }));

  const { data: insertedClients, error: clientErr } = await supabase
    .from("clients")
    .insert(clients)
    .select();

  if (clientErr) console.error("Client error:", clientErr);
  else console.log(`Inserted ${insertedClients.length} clients`);

  // 3. Create 3 Campaigns
  const campaigns = [
    { name: "Welcome Promo", message: "Welcome to our store!", platform: "whatsapp", status: "sent" as any, user_id: userId },
    { name: "Newsletter March", message: "Check our new items!", platform: "telegram", status: "scheduled" as any, user_id: userId },
    { name: "Flash Sale", message: "Everything 50% off today!", platform: "instagram", status: "draft" as any, user_id: userId }
  ];

  const { data: insertedCampaigns, error: campErr } = await supabase
    .from("campaigns")
    .insert(campaigns)
    .select();

  if (campErr) console.error("Campaign error:", campErr);
  else console.log(`Inserted ${insertedCampaigns.length} campaigns`);

  // 4. Create 20 Messages
  if (insertedClients && insertedClients.length > 0) {
    const statuses = ['sent', 'delivered', 'read', 'failed'];
    const messages = Array.from({ length: 20 }).map((_, i) => ({
      user_id: userId,
      client_id: insertedClients[i % insertedClients.length].id,
      campaign_id: (insertedCampaigns && insertedCampaigns.length > 0) ? insertedCampaigns[i % insertedCampaigns.length].id : null,
      message: `Message content ${i + 1}`,
      platform: "whatsapp",
      direction: "outbound",
      status: statuses[i % statuses.length]
    }));

    const { error: msgErr } = await supabase.from("message_logs").insert(messages);
    if (msgErr) console.error("Message error:", msgErr);
    else console.log("Inserted 20 messages");
  }

  // 5. Create 2 Flows
  const workflows = [
    { name: "Welcome Flow", active: true, user_id: userId },
    { name: "Retention Flow", active: false, user_id: userId }
  ];

  const { data: insertedWorkflows, error: wfErr } = await supabase
    .from("flows")
    .insert(workflows as any)
    .select();

  if (wfErr) console.error("Flow error:", wfErr);
  else {
    console.log(`Inserted ${insertedWorkflows.length} flows`);
    
    // 6. Create 10 Steps for the first workflow
    const steps = [
      { user_id: userId, flow_id: insertedWorkflows[0].id, step_order: 1, step_type: 'wait', config: { delay: '5m' } },
      { user_id: userId, flow_id: insertedWorkflows[0].id, step_order: 2, step_type: 'send_message', config: { template: 'welcome' } },
      { user_id: userId, flow_id: insertedWorkflows[0].id, step_order: 3, step_type: 'add_tag', config: { tag: 'new_prospect' } },
      { user_id: userId, flow_id: insertedWorkflows[0].id, step_order: 4, step_type: 'start_campaign', config: { campaign_id: insertedCampaigns?.[0].id } },
      { user_id: userId, flow_id: insertedWorkflows[0].id, step_order: 5, step_type: 'condition', config: { if: 'opened' } },
      { user_id: userId, flow_id: insertedWorkflows[1].id, step_order: 1, step_type: 'send_message', config: { template: 'retention' } }
    ];

    const { error: stepErr } = await supabase.from("flow_steps").insert(steps as any);
    if (stepErr) console.error("Step error:", stepErr);
    else console.log("Inserted flow steps");
  }

  console.log("Seed complete.");
}

(window as any).runSeed = seed;
