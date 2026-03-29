import { supabase } from "@/lib/supabase";
import { queueManager } from "./queue-manager";

export type TriggerType = 'client_created' | 'tag_added' | 'tag_removed' | 'message_received' | 'campaign_completed';

export class TriggerEngine {
  async processEvent(type: TriggerType, payload: any, userId: string) {
    console.log(`[TriggerEngine] Processando evento: ${type} para user: ${userId}`);
    
    // 1. Buscar gatilhos ativos para este tipo de evento
    const { data: triggers, error } = await (supabase as any)
      .from("automation_triggers")
      .select("flow_id, conditions")
      .eq("trigger_type", type)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error || !triggers) return;

    for (const trigger of triggers) {
      if (this.evaluateConditions(trigger.conditions, payload)) {
        console.log(`[TriggerEngine] Gatilho ativado! Iniciando fluxo: ${trigger.flow_id || trigger.workflow_id}`);
        await this.startWorkflow(trigger.flow_id || trigger.workflow_id, payload.clientId, userId);
      }
    }
  }

  private evaluateConditions(conditions: any, payload: any): boolean {
    // Lógica simples: se não houver condições, é um match.
    if (!conditions || Object.keys(conditions).length === 0) return true;
    
    // Exemplo: { "tag": "vip" } bate se payload.tag === "vip"
    return Object.entries(conditions).every(([key, value]) => payload[key] === value);
  }

  private async startWorkflow(workflowId: string, clientId: string, userId: string) {
    // Criar registro de execução na tabela correta (flow_executions)
    const { data: execution, error } = await (supabase as any)
      .from("flow_executions")
      .insert({
        flow_id: workflowId,
        client_id: clientId,
        status: 'running',
        current_step: 1,
        user_id: userId
      })
      .select()
      .single();

    if (error || !execution) {
      console.error("[TriggerEngine] Erro ao iniciar execução do fluxo:", error);
      return;
    }

    // Adiciona na fila o primeiro passo (flow_step)
    await queueManager.enqueueTask({
      task_type: 'flow_step',
      payload: { executionId: execution.id, stepOrder: 1 },
      run_at: new Date().toISOString(),
      max_attempts: 3
    } as any);
  }
}

export const triggerEngine = new TriggerEngine();
