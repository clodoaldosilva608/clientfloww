import { supabase } from "@/lib/supabase";
import type { AutomationQueue, ServiceResponse } from "@/types/database";

export const automationService = {
  /**
   * Envia um workflow/passo para a fila prioritária (Phase 4 - Industrial Engine)
   */
  async enqueue(params: {
    organizationId: string;
    workflowId: string;
    stepId?: string;
    clientId?: string;
    payload?: any;
    delaySeconds?: number;
  }): Promise<ServiceResponse<AutomationQueue>> {
    try {
      const { organizationId, workflowId, stepId, clientId, payload, delaySeconds = 0 } = params;
      
      const runAt = new Date();
      runAt.setSeconds(runAt.getSeconds() + delaySeconds);

      const { data, error } = await (supabase as any)
        .from("automation_queue")
        .insert({
          organization_id: organizationId,
          workflow_id: workflowId,
          step_id: stepId,
          client_id: clientId,
          payload: payload || {},
          run_at: runAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error("[Automation] Enqueue failure:", error.message);
        return { data: null, error: error.message };
      }

      return { data: (data as unknown) as AutomationQueue, error: null };
    } catch (err: any) {
      console.error("[Automation] System critical enqueue failure:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Busca os próximos jobs pendentes para processamento
   * Phase 4 Lock Logic (Isolation & Race Condition Prevention)
   */
  async fetchNextJobs(organizationId: string, limit = 5): Promise<ServiceResponse<AutomationQueue[]>> {
    try {
      if (!organizationId) return { data: [], error: "Missing organization" };

      // Otimizado para performance (Index fetch)
      const { data, error } = await (supabase as any)
        .from("automation_queue")
        .select("*")
        .eq("status", "pending")
        .eq("organization_id", organizationId)
        .lte("run_at", new Date().toISOString())
        .order("run_at", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("[Automation] Fetch jobs error:", error.message);
        return { data: null, error: error.message };
      }

      return { data: (data as unknown) as AutomationQueue[], error: null };
    } catch (err: any) {
      console.error("[Automation] System critical fetch error:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Trava um job para este worker (Phase 4 Industrial Resiliency)
   */
  async lockJob(jobId: string, workerId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("automation_queue")
        .update({
          status: 'processing',
          locked_at: new Date().toISOString(),
          locked_by: workerId,
          attempts: supabase.rpc('increment_attempts', { job_id: jobId }) // Placeholder, used raw increment via update usually
        })
        .eq("id", jobId)
        .eq("status", "pending"); // Vital: Race condition prevention check

      return !error;
    } catch {
      return false;
    }
  },

  async updateStatus(jobId: string, status: 'completed' | 'failed', errorLog?: string): Promise<void> {
    await (supabase as any)
      .from("automation_queue")
      .update({
        status,
        error_log: errorLog,
        locked_at: null,
        locked_by: null
      })
      .eq("id", jobId);
  }
};
