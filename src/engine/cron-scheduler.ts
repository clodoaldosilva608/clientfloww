import { workerManager } from "./worker-manager";

export class CronScheduler {
  interval: any;

  start(intervalMs: number = 15000) {
    console.log(`[CronScheduler] Starting with interval ${intervalMs}ms`);
    this.interval = setInterval(() => this.check(), intervalMs);
  }

  async check() {
    console.log(`[CronScheduler] Checking for tasks to process...`);
    // The WorkerManager already checks the queue in its own tick.
    // The CronScheduler can acts as a higher-level supervisor 
    // or trigger specific system tasks like cleanup.
    await workerManager.tick(); 
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}

export const cronScheduler = new CronScheduler();
