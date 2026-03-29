import { supabase } from "@/lib/supabase";
import { queueManager } from "../queue-manager";
import { StepResult } from "../types";

export async function handleWait(executionId: string, step: any): Promise<StepResult> {
  const { delayMinutes = 1 } = step.config;
  const runAt = new Date(Date.now() + delayMinutes * 60000).toISOString();

  console.log(`[Engine] Pausing execution ${executionId}. Will resume at ${runAt}`);

  // 1. Mark current execution as paused/running (it stays in running but we stop processing here)
  // Optionally update a "next_run_at" column if added to schema

  // 2. Schedule the next step in the future
  const { data: execution } = await (supabase as any)
    .from("workflow_executions")
    .select("user_id, organization_id")
    .eq("id", executionId)
    .single();

  await queueManager.enqueueTask({
    organization_id: (execution as any)?.organization_id,
    user_id: (execution as any)?.user_id,
    task_type: 'workflow_step',
    payload: { executionId, stepOrder: step.step_order + 1 },
    run_at: runAt,
    max_attempts: 3
  } as any);

  return { success: true, pause: true };
}
