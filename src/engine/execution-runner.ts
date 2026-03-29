import { supabase } from "@/lib/supabase";
import { stepExecutor } from "./step-executor";
import { automationService } from "@/services/automation.service";
import { queueManager } from "./queue-manager";
import type { Database } from "@/integrations/supabase/types";

type WorkflowExecution = Database["public"]["Tables"]["flow_executions"]["Row"];
type WorkflowStep = Database["public"]["Tables"]["flow_steps"]["Row"];

export const executionRunner = {
  async runStep(executionId: string, stepOrder: number) {
    // 1. Load context
    const { data: execution } = await supabase
      .from("flow_executions")
      .select("*, flows(*)")
      .eq("id", executionId)
      .single();

    if (!execution || (execution as any).status !== 'running') return;

    // 2. Load step definition
    const { data: step } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", (execution as any).flow_id || (execution as any).workflow_id)
      .eq("step_order", stepOrder)
      .single();

    if (!step) {
      // Workflow finished
      await automationService.updateExecution(executionId, { 
        status: 'completed'
      } as any);
      return;
    }

    // 3. Execute step
    const result = await stepExecutor.execute(step as WorkflowStep, execution as any);

    // 4. Log and Update
    await automationService.logStep(executionId, step.id, result.success ? 'success' : 'failed', result as any);

    if (result.pause) return; // Wait handler handles resuming

    if (result.success) {
      const nextStepOrder = stepOrder + 1;
      
      // Coloca o próximo passo na fila do worker pool
      await queueManager.enqueueTask({
        task_type: 'flow_step',
        payload: { executionId, stepOrder: nextStepOrder },
        run_at: new Date().toISOString(),
        max_attempts: 3
      } as any);
      
      await automationService.updateExecution(executionId, { current_step: nextStepOrder } as any);
    } else {
      await automationService.updateExecution(executionId, { status: 'failed' } as Partial<WorkflowExecution>);
    }
  }
};
