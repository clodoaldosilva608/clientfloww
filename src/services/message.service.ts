import { supabase } from "@/lib/supabase";
import type { MessageLog, ServiceResponse } from "@/types/database";

export const messageService = {
  async listLogs(limit = 100, organizationId: string): Promise<ServiceResponse<MessageLog[]>> {
    try {
      if (!organizationId) return { data: [], error: "Unauthorized" };

      const { data, error } = await (supabase as any)
        .from("message_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[Service Error] messageService.listLogs:", error.message);
        return { data: null, error: error.message };
      }

      return { data: (data as unknown) as MessageLog[], error: null };
    } catch (err: any) {
      console.error("[System Error] messageService.listLogs critical failure:", err);
      return { data: null, error: err.message };
    }
  },

  async listByClient(clientId: string, organizationId: string): Promise<ServiceResponse<MessageLog[]>> {
    try {
      if (!organizationId) return { data: [], error: "Unauthorized" };

      const { data, error } = await (supabase as any)
        .from("message_logs")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Service Error] messageService.listByClient:", error.message);
        return { data: null, error: error.message };
      }

      return { data: (data as unknown) as MessageLog[], error: null };
    } catch (err: any) {
      console.error("[System Error] messageService.listByClient critical failure:", err);
      return { data: null, error: err.message };
    }
  }
};
