import { supabase } from "@/lib/supabase";
import { workerManager } from "./worker-manager";

export const engineMonitor = {
  async getStats() {
    // Busca contagem de tarefas por status na fila de automação
    const { count: pending } = await supabase.from("automation_queue").select("*", { count: 'exact', head: true }).eq("status", "pending");
    const { count: processing } = await supabase.from("automation_queue").select("*", { count: 'exact', head: true }).eq("status", "processing");
    const { count: failed } = await supabase.from("automation_queue").select("*", { count: 'exact', head: true }).eq("status", "failed");
    
    // Busca execuções ativas na tabela correta (flow_executions)
    const { count: activeExecutions } = await supabase.from("flow_executions").select("*", { count: 'exact', head: true }).eq("status", "running");

    const queueSize = (pending || 0) + (processing || 0);

    return {
      queueSize,
      activeWorkers: workerManager.workers.filter(w => w.isBusy).length,
      runningExecutions: activeExecutions || 0,
      processingRate: 0.5, // Taxa simulada ou calculada
      queue: {
        pending: pending || 0,
        processing: processing || 0,
        failed: failed || 0
      },
      workers: {
        total: workerManager.workers.length,
        busy: workerManager.workers.filter(w => w.isBusy).length
      },
      executions: {
        active: activeExecutions || 0
      },
      timestamp: new Date().toISOString()
    };
  }
};
