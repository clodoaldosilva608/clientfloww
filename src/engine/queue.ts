import { engine } from "./automation-engine";

export const automationQueue = {
  async enqueue(executionId: string, stepOrder: number) {
    console.log(`[Queue] Enqueuing step ${stepOrder} for execution ${executionId}`);
    // Simulate async execution (in real life, this would be a message queue or cron)
    setTimeout(() => {
      engine.processStep(executionId, stepOrder);
    }, 100);
  }
};
