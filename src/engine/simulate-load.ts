import { queueManager } from "./queue-manager";
import { supabase } from "@/lib/supabase";

export async function simulateLoad(count: number = 100) {
  console.log(`[Simulator] Starting stress test for ${count} executions...`);
  
  // 1. Get a test workflow
  const { data: workflow } = await (supabase as any).from("workflows").select("id, organization_id").limit(1).single();
  
  if (!workflow) {
    console.error("[Simulator] No workflow found in DB. Create one first.");
    return;
  }

  // 2. Get some clients
  const { data: clients } = await supabase.from("clients").select("id").limit(10);
  
  if (!clients || clients.length === 0) {
    console.error("[Simulator] No clients found in DB.");
    return;
  }

  console.log(`[Simulator] Creating ${count} execution tasks...`);

  for (let i = 0; i < count; i++) {
    const clientId = clients[i % clients.length].id;
    
    // Create execution record
    const { data: execution } = await (supabase as any).from("workflow_executions").insert({
      workflow_id: workflow.id,
      client_id: clientId,
      organization_id: workflow.organization_id,
      status: 'running',
      current_step_order: 1
    }).select().single();

    if (execution) {
      // Enqueue first step
      await queueManager.enqueueTask({
        organization_id: workflow.organization_id,
        task_type: 'workflow_step',
        payload: { executionId: execution.id, stepOrder: 1 },
        run_at: new Date().toISOString(),
        max_attempts: 3
      });
    }

    if (i % 10 === 0) console.log(`[Simulator] Enqueued ${i} tasks...`);
  }

  console.log(`[Simulator] Load simulation complete. Monitor engine stats now.`);
}
