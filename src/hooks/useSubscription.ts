/**
 * src/hooks/useSubscription.ts
 * Phase 6 — SaaS Subscription Hook
 * 
 * Provides subscription state, plan limits, and paywall enforcement
 * throughout the entire application.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { billingService } from "@/services/billing.service";
import type { Plan, Subscription, PlanLimits } from "@/types/database";

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  limits: PlanLimits | null;
  usage: {
    clients: number;
    campaigns: number;
    automations: number;
    messages_this_month: number;
  } | null;
  isLoading: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  isActive: boolean;
  canUse: (resource: keyof PlanLimits) => boolean;
  getUsagePercent: (resource: keyof PlanLimits) => number;
  refetch: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { organization } = useAuth();
  const orgId = organization?.id || "";

  const { data: subscription, isLoading: subLoading, refetch } = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await billingService.getSubscription(orgId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!orgId,
    staleTime: 30_000, // Cache for 30s
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["billing-usage", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await billingService.getUsageStats(orgId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!orgId,
    staleTime: 60_000, // Cache for 1 min
  });

  const plan = subscription?.plan || null;
  const limits = plan?.limits || null;

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const isFree = plan?.name === "Starter" || !plan;
  const isPro = plan?.name === "Pro";
  const isEnterprise = plan?.name === "Enterprise";

  const canUse = (resource: keyof PlanLimits): boolean => {
    if (!limits || !usage) return true; // Fail open
    const limit = limits[resource];
    if (limit === null) return true; // Unlimited

    const usageMap: Record<keyof PlanLimits, number> = {
      clients: usage.clients,
      campaigns: usage.campaigns,
      automations: usage.automations,
      messages_per_month: usage.messages_this_month,
    };

    return usageMap[resource] < limit;
  };

  const getUsagePercent = (resource: keyof PlanLimits): number => {
    if (!limits || !usage) return 0;
    const limit = limits[resource];
    if (limit === null) return 0; // Unlimited = 0% used

    const usageMap: Record<keyof PlanLimits, number> = {
      clients: usage.clients,
      campaigns: usage.campaigns,
      automations: usage.automations,
      messages_per_month: usage.messages_this_month,
    };

    return Math.min(Math.round((usageMap[resource] / limit) * 100), 100);
  };

  return {
    subscription: subscription || null,
    plan,
    limits,
    usage: usage || null,
    isLoading: subLoading || usageLoading,
    isPro,
    isEnterprise,
    isFree,
    isActive,
    canUse,
    getUsagePercent,
    refetch,
  };
}
