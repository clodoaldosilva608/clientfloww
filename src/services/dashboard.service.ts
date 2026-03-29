import { supabase } from "@/lib/supabase";
import type { ServiceResponse } from "@/types/database";

export interface DashboardStats {
  total_clients: number;
  total_messages: number;
  delivered_messages: number;
  active_campaigns: number;
  response_rate: number;
}

export const dashboardService = {
  async getStats(organizationId: string): Promise<ServiceResponse<DashboardStats>> {
    try {
      if (!organizationId) return { data: null, error: "Unauthorized" };

      // Executa RPC (Step 7 & 8)
      // Nota: get_dashboard_stats existe no banco mas pode não estar nos tipos gerados.
      const { data, error } = await (supabase as any).rpc("get_dashboard_stats", { 
        p_organization_id: organizationId
      });

      if (!error && data) {
        return { data: data as DashboardStats, error: null };
      }

      console.warn("[Dashboard] RPC falhou, iniciando fallback manual...", error);

      // Manual Fallback for Phase 3 (Strict Organization Filtering)
      const [{ count: clients }, { count: messages }, { count: campaigns }] = await Promise.all([
        supabase.from("clients").select("*", { count: 'exact', head: true }).eq("organization_id", organizationId),
        supabase.from("message_logs").select("*", { count: 'exact', head: true }).eq("organization_id", organizationId),
        supabase.from("campaigns").select("*", { count: 'exact', head: true }).eq("organization_id", organizationId)
      ]);

      return {
        data: {
          total_clients: clients || 0,
          total_messages: messages || 0,
          delivered_messages: messages || 0,
          active_campaigns: campaigns || 0,
          response_rate: 0
        },
        error: null
      };
    } catch (err: any) {
      console.error("[Service Error] dashboardService.getStats:", err);
      return { data: null, error: err.message };
    }
  }
};
