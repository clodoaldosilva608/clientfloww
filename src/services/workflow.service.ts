import { supabase } from "@/lib/supabase";
import type { Flow, FlowStep, ServiceResponse } from "@/types/database";

export const workflowService = {
  async list(organizationId: string): Promise<ServiceResponse<Flow[]>> {
    try {
      if (!organizationId) return { data: [], error: "Unauthorized" };

      const { data, error } = await supabase
        .from("flows")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Service Error] workflowService.list:", error.message);
        return { data: null, error: error.message };
      }

      return { data: data as Flow[], error: null };
    } catch (err: any) {
      console.error("[Service Error] workflowService.list:", err);
      return { data: null, error: err.message };
    }
  },

  async getSteps(flowId: string, organizationId: string): Promise<ServiceResponse<FlowStep[]>> {
    try {
      if (!organizationId) return { data: [], error: "Unauthorized" };

      const { data, error } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("flow_id", flowId)
        .eq("organization_id", organizationId)
        .order("position", { ascending: true });

      if (error) {
        console.error("[Service Error] workflowService.getSteps:", error.message);
        return { data: null, error: error.message };
      }

      return { data: data as FlowStep[], error: null };
    } catch (err: any) {
      console.error("[Service Error] workflowService.getSteps:", err);
      return { data: null, error: err.message };
    }
  },

  async create(organizationId: string, flow: Partial<Flow>): Promise<ServiceResponse<Flow | null>> {
    try {
      if (!organizationId) return { data: null, error: "Unauthorized" };

      const { data, error } = await supabase
        .from("flows")
        .insert({ ...flow, organization_id: organizationId } as any)
        .select()
        .single();

      if (error || !data) {
        console.error("[Service Error] workflowService.create:", error?.message);
        return { data: null, error: error?.message || "Creation failed" };
      }

      return { data: data as Flow, error: null };
    } catch (err: any) {
      console.error("[Service Error] workflowService.create:", err);
      return { data: null, error: err.message };
    }
  }
};
