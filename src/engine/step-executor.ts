import { handleSendMessage } from "./handlers/send_message.handler";
import { handleWait } from "./handlers/wait.handler";
import { supabase } from "@/lib/supabase";
import { StepResult } from "./types";

export const stepExecutor = {
  async execute(step: any, execution: any): Promise<StepResult> {
    console.log(`[StepExecutor] Executing ${step.step_type} for execution ${execution.id}`);
    
    try {
      switch (step.step_type) {
        case 'send_message':
          return await handleSendMessage(execution.id, step, execution.client_id);
        
        case 'wait':
          return await handleWait(execution.id, step);

        case 'add_tag':
          return await this.handleAddTag(execution.client_id, step.config.tag);

        case 'remove_tag':
          return await this.handleRemoveTag(execution.client_id, step.config.tag);

        case 'update_client':
          return await this.handleUpdateClient(execution.client_id, step.config.updates);

        case 'webhook':
          return await this.handleWebhook(step.config.url, step.config.payload);

        default:
          return { success: false, error: `Unknown step type: ${step.step_type}` };
      }
    } catch (e: any) {
      return { success: false, error: String(e.message ?? e) };
    }
  },

  async handleAddTag(clientId: string, tag: string): Promise<StepResult> {
    const { error } = await supabase.from("client_tags").insert({ client_id: clientId, tag });
    return { success: !error, error: error?.message };
  },

  async handleRemoveTag(clientId: string, tag: string): Promise<StepResult> {
    const { error } = await supabase.from("client_tags").delete().eq("client_id", clientId).eq("tag", tag);
    return { success: !error, error: error?.message };
  },

  async handleUpdateClient(clientId: string, updates: any): Promise<StepResult> {
    const { error } = await supabase.from("clients").update(updates).eq("id", clientId);
    return { success: !error, error: error?.message };
  },

  async handleWebhook(url: string, payload: any): Promise<StepResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: response.ok, data: { status: response.status } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
