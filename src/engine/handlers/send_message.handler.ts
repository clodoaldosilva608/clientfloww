import { supabase } from "@/lib/supabase";
import { rateLimiter } from "../rate-limiter";
import { StepResult } from "../types";

export async function handleSendMessage(executionId: string, step: any, clientId: string): Promise<StepResult> {
  const { message, platform } = step.config;

  // 1. Get user_id and organization_id from execution
  const { data: execution } = await (supabase as any)
    .from("flow_executions")
    .select("user_id, organization_id")
    .eq("id", executionId)
    .single();

  const userId = execution?.user_id;
  const orgId = execution?.organization_id;

  if (orgId) {
    // 2. Check and enforce Rate Limits
    const isAllowed = await rateLimiter.checkLimit(orgId, platform);
    if (!isAllowed) {
      console.log(`[Engine] Rate limit hit for ${platform} in org ${orgId}. Retrying via queue...`);
      throw new Error("RATE_LIMIT_EXCEEDED"); // This will trigger a retry
    }
  }

  console.log(`[Engine] Sending message via ${platform} to client ${clientId}`);

  // 3. Simulation of real provider call
  const status = Math.random() > 0.1 ? 'sent' : 'failed';

  // 4. Log message
  if (userId) {
     await (supabase as any).from("message_logs").insert({
      user_id: userId,
      organization_id: orgId,
      client_id: clientId,
      platform,
      message,
      status,
      direction: 'outbound'
    });
  }

  return { success: status === 'sent', error: status === 'failed' ? 'Provider rejected message' : null };
}
