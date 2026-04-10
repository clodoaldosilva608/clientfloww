import { supabase } from "@/lib/supabase";
import type { IntegrationConfig, ServiceResponse } from "@/types/database";

export const integrationService = {
  async getConfig(platform: string, organizationId: string): Promise<ServiceResponse<IntegrationConfig | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: "Unauthorized" };

      const { data, error } = await (supabase as any)
        .from("integration_configs")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("platform", platform)
        .maybeSingle();

      if (error) {
        console.error(`[Service Error] integrationService.getConfig(${platform}):`, error.message);
        return { data: null, error: error.message };
      }

      return { data: (data as unknown) as IntegrationConfig, error: null };
    } catch (err: any) {
      console.error(`[System Error] integrationService.getConfig(${platform}):`, err);
      return { data: null, error: err.message };
    }
  },

  async saveConfig(platform: string, isActive: boolean, config: Record<string, any>, organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) return { data: false, error: "Unauthorized" };

      if (!platform) return { data: false, error: "Platform is required" };

      const { error } = await (supabase as any)
        .from("integration_configs")
        .upsert({
          user_id: user.id,
          organization_id: organizationId,
          platform,
          is_active: isActive,
          config: config as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id,platform" }); 

      if (error) {
        console.error(`[Service Error] integrationService.saveConfig(${platform}):`, error.message);
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: any) {
      console.error(`[System Error] integrationService.saveConfig(${platform}):`, err);
      return { data: false, error: err.message };
    }
  }
};
