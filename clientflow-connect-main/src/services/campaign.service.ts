import { supabase } from "@/lib/supabase";
import { automationService } from "./automation.service";
import type { Campaign, ServiceResponse } from "@/types/database";

export const campaignService = {
  async list(organizationId: string): Promise<ServiceResponse<Campaign[]>> {
    try {
      if (!organizationId) return { data: [], error: "Unauthorized" };

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("[Service Error] campaignService.list:", error?.message);
        return { data: null, error: error?.message || "Failed to fetch" };
      }

      const withCounts = await Promise.all(
        data.map(async (c: any) => {
          const { count } = await (supabase as any)
            .from("campaign_targets")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", c.id)
            .eq("organization_id", organizationId);
          return { ...c, target_count: count || 0 };
        })
      );

      return { data: withCounts as Campaign[], error: null };
    } catch (err: any) {
      console.error("[System Error] campaignService.list critical failure:", err);
      return { data: null, error: err.message };
    }
  },

  async create(organizationId: string, campaign: Partial<Campaign>, selectedClients: string[]): Promise<ServiceResponse<Campaign | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) return { data: null, error: "Unauthorized" };

      const { data, error } = await supabase
        .from("campaigns")
        .insert({ 
          ...campaign, 
          user_id: user.id,
          organization_id: organizationId
        } as any)
        .select()
        .single();

      if (error || !data) {
        console.error("[Service Error] campaignService.create:", error?.message);
        return { data: null, error: error?.message || "Creation failed" };
      }

      if (selectedClients.length > 0) {
        const { error: targetError } = await (supabase as any).from("campaign_targets").insert(
          selectedClients.map(c_id => ({ 
            campaign_id: data.id, 
            client_id: c_id,
            organization_id: organizationId
          }))
        );
        
        if (targetError) {
          console.error("[Service Warning] campaign_targets insert failed:", targetError.message);
        } else {
          // PHASE 4 INDUSTRIAL: Enfileirar jobs de automação para cada cliente do alvo
          for (const clientId of selectedClients) {
             await automationService.enqueue({
                organizationId,
                workflowId: data.id, // Campaign ID used as workflow reference
                clientId: clientId,
                payload: { type: 'send_message', text: campaign.message, platform: campaign.platform },
                delaySeconds: campaign.scheduled_at ? Math.max(0, (new Date(campaign.scheduled_at).getTime() - Date.now()) / 1000) : 0
             });
          }
          console.log(`[Industrial Engine] Enqueued ${selectedClients.length} jobs for campaign ${data.id}`);
        }
      }

      return { data: data as Campaign, error: null };
    } catch (err: any) {
      console.error("[Service Error] campaignService.create:", err);
      return { data: null, error: err.message };
    }
  },

  async delete(id: string, organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!organizationId) return { data: false, error: "Unauthorized" };
      
      await (supabase as any).from("campaign_targets").delete().eq("campaign_id", id).eq("organization_id", organizationId);
      
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error("[Service Error] campaignService.delete:", error.message);
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: any) {
      console.error("[Service Error] campaignService.delete:", err);
      return { data: false, error: err.message };
    }
  },

  async updateStatus(id: string, organizationId: string, status: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!organizationId) return { data: false, error: "Unauthorized" };

      const { error } = await supabase
        .from("campaigns")
        .update({ status })
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error("[Service Error] campaignService.updateStatus:", error.message);
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: any) {
      console.error("[Service Error] campaignService.updateStatus:", err);
      return { data: false, error: err.message };
    }
  }
};
