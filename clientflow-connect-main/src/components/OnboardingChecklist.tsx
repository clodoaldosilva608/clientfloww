/**
 * src/components/OnboardingChecklist.tsx
 * Phase 9 - Growth & Onboarding
 *
 * Provides a step-by-step checklist to guide a new user to activation.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Rocket, ChevronRight, Users, Megaphone, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/tracking";

interface OnboardingProps {
  stats: any;
  isVisible: boolean;
}

export function OnboardingChecklist({ stats, isVisible }: OnboardingProps) {
  const [closed, setClosed] = useState(false);

  // Mark steps as complete based on real backend metrics
  const steps = [
    {
      id: "client",
      title: "Adicione seu primeiro cliente",
      desc: "Importe ou cadastre um cliente na base.",
      path: "/clientes",
      icon: Users,
      done: (stats?.total_clients || 0) > 0,
    },
    {
      id: "campaign",
      title: "Crie a primeira campanha",
      desc: "Monte uma promoção rápida para teste.",
      path: "/campanhas",
      icon: Megaphone,
      done: (stats?.active_campaigns || 0) > 0 || (stats?.total_messages || 0) > 0,
    },
    {
      id: "automation",
      title: "Ative uma automação",
      desc: "Configure o assistente ou funil rotineiro.",
      path: "/automacoes/builder",
      icon: Zap,
      done: false, // For phase 9 default, typically tracked separately
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  useEffect(() => {
    // Fire tracking event upon activation success
    if (progress === 100 && !closed) {
      trackEvent("conversion", { flow: "onboarding_complete" });
    }
  }, [progress, closed]);

  if (!isVisible || closed || progress === 100) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-6 overflow-hidden"
      >
        <div className="bento-item bg-zinc-950/40 border-primary/20 p-6 relative">
          <button
            onClick={() => setClosed(true)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
          >
            Dispensar
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Rocket className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Guia Rápido de Início
                </h3>
              </div>
              <p className="text-sm text-zinc-400 font-medium">
                Siga estes {steps.length} passos para ativar sua conta e aproveitar o poder do ClientFlow.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-primary">{progress}% Concluído</span>
                  <span className="text-zinc-500">
                    {completedCount} de {steps.length} passos
                  </span>
                </div>
                <Progress value={progress} className="h-2 bg-zinc-900" />
              </div>
            </div>

            <div className="w-full md:w-auto grid grid-cols-1 gap-3 md:flex md:flex-col md:min-w-[320px]">
              {steps.map((step) => (
                <Link
                  key={step.id}
                  to={step.path}
                  onClick={() => trackEvent(`onboarding_click_${step.id}` as any)}
                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                    step.done
                      ? "bg-primary/10 border-primary/20 opacity-60"
                      : "bg-zinc-900 border-white/5 hover:border-primary/50"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-zinc-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-xs font-black uppercase tracking-tight ${step.done ? "text-primary" : "text-white"}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-zinc-500">{step.desc}</p>
                  </div>
                  {!step.done && <ChevronRight className="h-4 w-4 text-zinc-600" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
