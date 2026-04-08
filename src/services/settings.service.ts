import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
type AppSettingsUpdate = Database["public"]["Tables"]["app_settings"]["Update"];

export const settingsService = {
  async getSettings(userId: string): Promise<{ data: AppSettings | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async updateSettings(userId: string, updates: AppSettingsUpdate): Promise<{ data: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("app_settings")
        .update(updates)
        .eq("user_id", userId);
        
      if (error) return { data: false, error: error.message };
      return { data: true, error: null };
    } catch (err: unknown) {
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
};
