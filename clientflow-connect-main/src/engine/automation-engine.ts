import { automationService } from "@/services/automation.service";
import { queueManager } from "./queue-manager";
import { workerManager } from "./worker-manager";

export const engine = {
  /**
   * Initialize the engine (start workers)
   */
  init() {
    workerManager.start();
  },

  start() {
    this.init();
  },

  stop() {
    // Logic to stop workers if needed
  },

  /**
   * Trigger the start of a workflow for a client
   */
  async trigger(workflowId: string, clientId: string, organizationId?: string) {
    console.log(`[Engine] Initiating workflow ${workflowId} for client ${clientId}`);

    // 1. Create execution record
    const execution = await automationService.startExecution(workflowId, clientId);

    // 2. Enqueue first step
    await queueManager.enqueueTask({
      organization_id: organizationId,
      task_type: 'workflow_step',
      payload: { executionId: execution.id, stepOrder: 1 },
      run_at: new Date().toISOString(),
      max_attempts: 3
    });

    return execution;
  },

  async enqueue(executionId: string, stepOrder: number, organizationId?: string) {
     await queueManager.enqueueTask({
      organization_id: organizationId,
      task_type: 'workflow_step',
      payload: { executionId, stepOrder },
      run_at: new Date().toISOString(),
      max_attempts: 3
    });
  },

  async processStep(executionId: string, stepOrder: number) {
    console.log(`[Engine] Processing step ${stepOrder} for execution ${executionId}`);
    // Logic to fetch step and execute it
  }
};

export const automationEngine = engine;
