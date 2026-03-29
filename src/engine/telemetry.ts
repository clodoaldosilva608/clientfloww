import { supabase } from "@/lib/supabase";

export const metrics = {
  async track(orgId: string, name: string, value: number, tags: any = {}) {
    await (supabase as any).from("system_metrics").insert({
      organization_id: orgId,
      metric_name: name,
      metric_value: value,
      tags
    });
  },

  async alert(orgId: string, type: string, severity: 'info' | 'warning' | 'critical', message: string) {
    await (supabase as any).from("system_alerts").insert({
      organization_id: orgId,
      alert_type: type,
      severity,
      message
    });
  }
};
