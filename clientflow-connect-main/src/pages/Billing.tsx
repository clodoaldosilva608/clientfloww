/**
 * src/pages/Billing.tsx
 * Phase 6 — SaaS Billing & Subscription Management
 * Premium pricing page with plan comparison, usage meters, and Stripe integration.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreditCard, Crown, Zap, Shield, Check, X,
  ArrowRight, Loader2, ExternalLink, AlertTriangle,
  Users, MessageSquare, Megaphone, Bot, Sparkles,
  Star, Rocket, Building2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { billingService } from "@/services/billing.service";
import { useQuery } from "@tanstack/react-query";
import type { Plan, PlanLimits } from "@/types/database";

const planIcons: Record<string, any> = {
  Starter: Zap,
  Pro: Rocket,
  Enterprise: Building2,
};

const planColors: Record<string, string> = {
  Starter: "from-zinc-600 to-zinc-800",
  Pro: "from-violet-500 to-indigo-600",
  Enterprise: "from-amber-500 to-orange-600",
};

const featureLabels: Record<string, string> = {
  basic: "Funcionalidades Básicas",
  automation: "Automações Avançadas",
  ai_copilot: "IA Copilot (Geração de Texto)",
  priority_support: "Suporte Prioritário 24/7",
  white_label: "White Label (Marca Própria)",
  api_access: "Acesso à API REST",
};

const limitLabels: Record<keyof PlanLimits, { label: string; icon: any }> = {
  clients: { label: "Clientes", icon: Users },
  campaigns: { label: "Campanhas", icon: Megaphone },
  automations: { label: "Automações", icon: Bot },
  messages_per_month: { label: "Mensagens/mês", icon: MessageSquare },
};

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organization } = useAuth();
  const { subscription, plan: currentPlan, usage, isLoading: subLoading, isFree, isPro, isEnterprise, getUsagePercent, refetch } = useSubscription();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await billingService.getPlans();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Handle Stripe redirect results
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura ativada com sucesso! 🎉", { description: "Seu plano já está em vigor." });
      refetch();
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado.", { description: "Nenhuma cobrança foi realizada." });
    }
  }, [searchParams, refetch]);

  const handleSubscribe = async (plan: Plan) => {
    if (!organization?.id) return toast.error("Organização não encontrada");
    if (plan.price === 0) return; // Can't checkout on free plan

    setLoadingPlanId(plan.id);
    try {
      const { data, error } = await billingService.createCheckoutSession(organization.id, plan.id);
      if (error) throw new Error(error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout", { description: err.message });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!organization?.id) return;
    try {
      const { data, error } = await billingService.createPortalSession(organization.id);
      if (error) throw new Error(error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Erro ao abrir portal", { description: err.message });
    }
  };

  const isCurrentPlan = (plan: Plan) => currentPlan?.id === plan.id;

  if (plansLoading || subLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="h-12 w-64 bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-[500px] bg-zinc-900 rounded-3xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-12 pb-32">
      {/* Header */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Planos & Assinaturas</span>
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter uppercase">
          <span className="premium-gradient bg-clip-text text-transparent">Escale seu Negócio</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
          Escolha o plano ideal para sua operação. Upgrade ou downgrade a qualquer momento sem burocracia.
        </p>
      </header>

      {/* Current Plan Status Bar */}
      {subscription && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="bento-item bg-zinc-950 border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${planColors[currentPlan?.name || 'Starter']} shadow-lg`}>
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black uppercase text-sm tracking-widest">{currentPlan?.name || 'Starter'}</h3>
                <Badge className={`text-[8px] font-black uppercase ${subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {subscription.status === 'active' ? 'ATIVO' : subscription.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {subscription.current_period_end 
                  ? `Próxima cobrança: ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`
                  : 'Plano gratuito — sem cobrança'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isFree && (
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                className="rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-widest h-11 px-6"
              >
                <ExternalLink className="h-3 w-3 mr-2" /> Gerenciar no Stripe
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Usage Meters */}
      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(limitLabels) as (keyof PlanLimits)[]).map((key, idx) => {
            const { label, icon: Icon } = limitLabels[key];
            const percent = getUsagePercent(key);
            const limit = currentPlan?.limits?.[key];
            const usageMap: Record<keyof PlanLimits, number> = {
              clients: usage.clients,
              campaigns: usage.campaigns,
              automations: usage.automations,
              messages_per_month: usage.messages_this_month,
            };
            const current = usageMap[key];

            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bento-item p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <span className={`text-[10px] font-black uppercase ${percent >= 90 ? 'text-red-500' : percent >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {limit === null ? '∞' : `${percent}%`}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
                <p className="text-2xl font-black tabular-nums">
                  {current}<span className="text-zinc-600 text-sm">/{limit === null ? '∞' : limit}</span>
                </p>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${limit === null ? 5 : percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans?.map((plan, idx) => {
          const PlanIcon = planIcons[plan.name] || Zap;
          const gradientClass = planColors[plan.name] || "from-zinc-600 to-zinc-800";
          const isCurrent = isCurrentPlan(plan);
          const features = plan.features as Record<string, boolean>;
          const limits = plan.limits as Record<string, number | null>;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={`relative rounded-[2rem] border overflow-hidden flex flex-col transition-all duration-300 ${
                plan.is_popular 
                  ? 'border-primary/30 shadow-2xl shadow-primary/10 scale-[1.02]' 
                  : 'border-white/5 hover:border-white/10'
              } ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}
            >
              {/* Popular badge */}
              {plan.is_popular && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl z-10">
                  <Star className="h-3 w-3 inline mr-1" /> Popular
                </div>
              )}

              {/* Plan Header */}
              <div className={`p-8 bg-gradient-to-br ${gradientClass} text-white`}>
                <PlanIcon className="h-10 w-10 mb-4 opacity-80" />
                <h3 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    {plan.price === 0 ? 'Grátis' : `R$${plan.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm opacity-60 font-bold">/mês</span>}
                </div>
              </div>

              {/* Limits */}
              <div className="p-6 space-y-3 border-b border-white/5 bg-zinc-950/50">
                {(Object.keys(limitLabels) as (keyof PlanLimits)[]).map(key => {
                  const { label, icon: Icon } = limitLabels[key];
                  const val = limits[key];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 text-zinc-600" />
                        <span className="text-[11px] font-bold text-zinc-400">{label}</span>
                      </div>
                      <span className="text-[11px] font-black text-white">
                        {val === null ? 'Ilimitado' : val.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Features */}
              <div className="p-6 flex-1 space-y-3">
                {Object.entries(featureLabels).map(([key, label]) => {
                  const enabled = features[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      {enabled ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-700 shrink-0" />
                      )}
                      <span className={`text-[11px] font-bold ${enabled ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="p-6 pt-0">
                {isCurrent ? (
                  <Button disabled className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-zinc-800 text-zinc-500 cursor-default">
                    <Shield className="h-4 w-4 mr-2" /> Plano Atual
                  </Button>
                ) : plan.price === 0 ? (
                  <Button disabled className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-zinc-500 cursor-default">
                    Incluído por padrão
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlanId === plan.id}
                    className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${
                      plan.is_popular 
                        ? 'premium-gradient text-white shadow-primary/20 hover:shadow-primary/40' 
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {loadingPlanId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {isFree ? 'Fazer Upgrade' : 'Trocar Plano'}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ / Trust */}
      <div className="max-w-2xl mx-auto text-center space-y-6 pt-8">
        <div className="flex items-center justify-center gap-6 text-zinc-600">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pagamento Seguro SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Powered by Stripe</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
          Cancele a qualquer momento. Sem multas, sem contratos. Seu acesso continua até o final do período pago.
        </p>
      </div>
    </motion.div>
  );
}
