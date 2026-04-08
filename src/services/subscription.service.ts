import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type UserSubscription = Database["public"]["Tables"]["user_subscriptions"]["Row"];
type StripeProduct = Database["public"]["Tables"]["stripe_products"]["Row"];

export const subscriptionService = {
  async getSubscription(userId: string): Promise<{ data: UserSubscription | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async getProducts(): Promise<{ data: StripeProduct[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("stripe_products")
        .select("*")
        .eq("active", true);

      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
};
