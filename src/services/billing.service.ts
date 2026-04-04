/**
 * src/services/billing.service.ts
 * Phase 6 — SaaS Billing Service Layer
 * 
 * Handles all billing operations: plans, subscriptions, limits checking.
 * Stripe Checkout is initiated via Supabase Edge Function for security.
 */

import { supabase } from "@/lib/supabase";
import type { Plan, Subscription, PlanLimits, ServiceResponse } from "@/types/database";

export const billingService = {
  /**
   * Fetch all available plans (public)
   */
  async getPlans(): Promise<ServiceResponse<Plan[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) {
        console.error("[Billing] Failed to fetch plans:", error.message);
        return { data: null, error: error.message };
      }

      return { data: data as Plan[], error: null };
    } catch (err: any) {
      console.error("[Billing] Critical error fetching plans:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Get current org subscription (with plan details joined)
   */
  async getSubscription(organizationId: string): Promise<ServiceResponse<Subscription | null>> {
    try {
      if (!organizationId) return { data: null, error: "Missing organization ID" };

      const { data, error } = await (supabase as any)
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[Billing] Failed to fetch subscription:", error.message);
        return { data: null, error: error.message };
      }

      if (data) {
        const planId = data.plan_id || data.plan;
        // Se existir um ID de plano (ou nome), busca na tabela plans
        if (planId && typeof planId === "string") {
          const { data: planData } = await (supabase as any)
             .from("plans")
             .select("*")
             .eq("id", planId)
             .maybeSingle();
          
          if (planData) {
             data.plan = planData;
          }
        }
      }

      return { data: data as Subscription | null, error: null };
    } catch (err: any) {
      console.error("[Billing] Critical error fetching subscription:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Get current plan limits for the organization
   */
  async getPlanLimits(organizationId: string): Promise<ServiceResponse<PlanLimits>> {
    try {
      const { data: sub, error } = await this.getSubscription(organizationId);
      if (error || !sub?.plan) {
        // Default to most restrictive limits (free plan)
        return {
          data: { clients: 50, campaigns: 5, automations: 2, messages_per_month: 500 },
          error: null
        };
      }

      return {
        data: sub.plan.limits as PlanLimits,
        error: null
      };
    } catch (err: any) {
      console.error("[Billing] Error getting plan limits:", err);
      return { data: { clients: 50, campaigns: 5, automations: 2, messages_per_month: 500 }, error: null };
    }
  },

  /**
   * Check if a specific resource limit has been reached
   */
  async checkLimit(
    organizationId: string,
    resource: keyof PlanLimits,
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    try {
      const { data: limits } = await this.getPlanLimits(organizationId);
      if (!limits) return { allowed: true, limit: null, current: currentCount };

      const limit = limits[resource];
      
      // null = unlimited
      if (limit === null) return { allowed: true, limit: null, current: currentCount };

      return {
        allowed: currentCount < limit,
        limit,
        current: currentCount
      };
    } catch {
      // Fail open - don't block user on billing errors
      return { allowed: true, limit: null, current: currentCount };
    }
  },

  /**
   * Create Stripe Checkout Session via Edge Function
   * The Edge Function handles Stripe API calls securely (server-side)
   */
  async createCheckoutSession(
    organizationId: string,
    planId: string
  ): Promise<ServiceResponse<{ url: string }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: "Not authenticated" };

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          organization_id: organizationId,
          plan_id: planId,
          user_email: user.email,
          success_url: `${window.location.origin}/billing?success=true`,
          cancel_url: `${window.location.origin}/billing?canceled=true`
        }
      });

      if (error) {
        console.error("[Billing] Checkout error:", error);
        return { data: null, error: error.message || "Failed to create checkout" };
      }

      return { data: { url: data.url }, error: null };
    } catch (err: any) {
      console.error("[Billing] Critical checkout error:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Create Stripe Customer Portal Session (manage subscription)
   */
  async createPortalSession(organizationId: string): Promise<ServiceResponse<{ url: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: {
          organization_id: organizationId,
          return_url: `${window.location.origin}/billing`
        }
      });

      if (error) {
        console.error("[Billing] Portal error:", error);
        return { data: null, error: error.message || "Failed to open portal" };
      }

      return { data: { url: data.url }, error: null };
    } catch (err: any) {
      console.error("[Billing] Critical portal error:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Cancel subscription (sets cancel_at_period_end = true)
   */
  async cancelSubscription(organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-cancel", {
        body: { organization_id: organizationId }
      });

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: any) {
      return { data: false, error: err.message };
    }
  },

  /**
   * Get usage statistics for the current billing period
   */
  async getUsageStats(organizationId: string): Promise<ServiceResponse<{
    clients: number;
    campaigns: number;
    automations: number;
    messages_this_month: number;
  }>> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [clientsRes, campaignsRes, automationsRes, messagesRes] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
        (supabase as any).from("flows").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
        supabase.from("message_logs").select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .gte("created_at", startOfMonth.toISOString())
      ]);

      return {
        data: {
          clients: clientsRes.count || 0,
          campaigns: campaignsRes.count || 0,
          automations: automationsRes.count || 0,
          messages_this_month: messagesRes.count || 0
        },
        error: null
      };
    } catch (err: any) {
      console.error("[Billing] Usage stats error:", err);
      return { data: null, error: err.message };
    }
  }
};
