import { supabase } from "@/lib/supabase";

export class RateLimiter {
  private lastRun: Record<string, number> = {};

  async checkLimit(organizationId: string, provider: string): Promise<boolean> {
    const key = `${organizationId}:${provider}`;
    
    // 1. Get limits from Cache or DB
    const { data: limit } = await (supabase as any)
      .from("provider_limits")
      .select("messages_per_second")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .maybeSingle();

    const mps = limit?.messages_per_second || 1.0; // Default 1 msg/sec
    const minInterval = 1000 / mps;

    const now = Date.now();
    const elapsed = now - (this.lastRun[key] || 0);

    if (elapsed < minInterval) {
      // Need to wait
      return false;
    }

    this.lastRun[key] = now;
    return true;
  }

  async wait(organizationId: string, provider: string) {
    const key = `${organizationId}:${provider}`;
    const { data: limit } = await (supabase as any)
      .from("provider_limits")
      .select("messages_per_second")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .maybeSingle();

    const mps = limit?.messages_per_second || 1.0;
    const interval = 1000 / mps;
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export const rateLimiter = new RateLimiter();
