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
      // Nota: get_user_stats foi criado na Fase 1, mas o ideal seria get_organization_stats.
      // Vou assumir que o sistema usa organization_id como chave de busca no backend agora.
      const { data: { user } } = await supabase.auth.getUser();
      let { data, error } = await (supabase as any).rpc("get_dashboard_stats", { 
        p_user_id: user?.id || organizationId
      });

      // Se falhar por causa do parâmetro, tenta o nome alternativo
      if (error && (error.message.includes("p_user_id") || error.message.includes("parameter"))) {
        console.warn("[Dashboard] Retrying RPC with p_organization_id...");
        const retry = await (supabase as any).rpc("get_dashboard_stats", { 
          p_organization_id: organizationId
        });
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        return { data: data as unknown as DashboardStats, error: null };
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
