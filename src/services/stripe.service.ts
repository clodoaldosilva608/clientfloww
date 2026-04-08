import { supabase } from "@/lib/supabase";

export const stripeService = {
  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized");

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId, successUrl, cancelUrl })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create checkout session");
      }

      const data = await response.json();
      return { url: data.url, error: null };
    } catch (err: unknown) {
      return { url: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async manageBillingPortal(returnUrl: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized");

      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ returnUrl })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to manage billing portal");
      }

      const data = await response.json();
      return { url: data.url, error: null };
    } catch (err: unknown) {
      return { url: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
};
