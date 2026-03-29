import { queueManager, Task } from "./queue-manager";
import { executionRunner } from "./execution-runner";

export class Worker {
  id: number;
  isBusy: boolean = false;

  constructor(id: number) {
    this.id = id;
  }

  async process(task: Task) {
    this.isBusy = true;
    console.log(`[Worker ${this.id}] Processing task ${task.id} (${task.task_type})`);
    
    try {
      if (task.task_type === 'flow_step') {
        const payload = task.payload as any;
        await executionRunner.runStep(payload.executionId, payload.stepOrder);
      }
      
      await queueManager.markCompleted(task.id);
    } catch (error: any) {
      console.error(`[Worker ${this.id}] Error:`, error);
      await queueManager.markFailed(task.id, error.message);
    } finally {
      this.isBusy = false;
    }
  }
}

export class WorkerManager {
  workers: Worker[] = [];
  interval: any;

  constructor(count: number = 5) {
    for (let i = 0; i < count; i++) {
      this.workers.push(new Worker(i));
    }
  }

  start() {
    this.interval = setInterval(() => this.tick(), 5000); // Check for tasks every 5s
    console.log(`[WorkerManager] Started with ${this.workers.length} workers.`);
  }

  async tick() {
    const availableWorkers = this.workers.filter(w => !w.isBusy);
    if (availableWorkers.length === 0) return;

    const tasks = await queueManager.dequeueTasks(availableWorkers.length);
    
    tasks.forEach((task, index) => {
      availableWorkers[index].process(task);
    });
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}

export const workerManager = new WorkerManager(10);
