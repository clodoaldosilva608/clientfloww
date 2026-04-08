import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Role = Database["public"]["Tables"]["roles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export const userService = {
  async getRoles(): Promise<{ data: Role[]; error: string | null }> {
    try {
      const { data, error } = await supabase.from("roles").select("*");
      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  },
  
  async getUserRole(userId: string): Promise<{ data: UserRole | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async setRole(userId: string, roleId: string): Promise<{ data: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role_id: roleId });
      if (error) return { data: false, error: error.message };
      return { data: true, error: null };
    } catch (err: unknown) {
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
};
