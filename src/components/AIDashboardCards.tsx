/**
 * src/components/AIDashboardCards.tsx
 * Phase 7 — Dashboard AI Cards
 *
 * Premium cards for the dashboard:
 * - "Sugestão da IA"
 * - "Clientes em risco"
 * - "Campanhas recomendadas"
 *
 * Data comes from gerarInsightsDashboard()
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { gerarInsightsDashboard } from "@/services/ai.orchestrator";
import { runAutonomousSellCycle } from "@/services/ai.orchestrator";
import { segmentarClientesAutomaticamente } from "@/services/ai-segmentation.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BrainCircuit, AlertTriangle, Megaphone, Sparkles,
  ArrowRight, RefreshCw, Zap, Users, Target,
  ShieldAlert, ChevronRight, Play, TrendingUp, Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── AI Suggestion Card ─────────────────────────────────────────────────────

function AISuggestionCard({
  suggestion,
  isLoading,
  onRefresh,
}: {
  suggestion: string;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-item bg-gradient-to-br from-violet-950/40 to-zinc-950/40 border-violet-500/10 hover:border-violet-500/20 transition-all p-6 relative overflow-hidden group"
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-all" />
      
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <BrainCircuit className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-violet-300 flex items-center gap-2">
              Sugestão da IA
              <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
            </h3>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Powered by Hugging Face</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 rounded-xl hover:bg-violet-500/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-zinc-500 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : (
        <p className="text-[12px] text-zinc-300 font-medium leading-relaxed relative">
          {suggestion}
        </p>
      )}
    </motion.div>
  );
}

// ─── Clients at Risk Card ───────────────────────────────────────────────────

function ClientsAtRiskCard({
  count,
  isLoading,
  onAutoReactivation,
}: {
  count: number;
  isLoading: boolean;
  onAutoReactivation: () => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bento-item bg-gradient-to-br from-red-950/30 to-zinc-950/40 border-red-500/10 hover:border-red-500/20 transition-all p-6 relative overflow-hidden group"
    >
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-red-300">
              Clientes em Risco
            </h3>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Previsão de churn</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-2xl" />
      ) : (
        <>
          <div className="flex items-end gap-3 mb-4 relative">
            <span className="text-4xl font-black text-red-400 tracking-tighter">{count}</span>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
              {count === 1 ? "cliente" : "clientes"} em risco
            </span>
          </div>

          <div className="flex items-center gap-2">
            {count > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={onAutoReactivation}
                      className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 premium-gradient text-white shadow-lg shadow-primary/20"
                    >
                      <Play className="h-3 w-3" /> Gerar Rascunho de Retenção
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] text-white p-3 max-w-[200px]">
                    <p>O Nexus AI criará uma proposta automática focada nos {count} clientes usando e-mail/whatsapp.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/ai")}
              className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              Ver detalhes <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Recommended Campaigns Card ─────────────────────────────────────────────

function RecommendedCampaignsCard({
  campaigns,
  isLoading,
  onAutoRun,
  isRunning,
}: {
  campaigns: string[];
  isLoading: boolean;
  onAutoRun: () => void;
  isRunning: boolean;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bento-item bg-gradient-to-br from-emerald-950/30 to-zinc-950/40 border-emerald-500/10 hover:border-emerald-500/20 transition-all p-6 relative overflow-hidden group"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Megaphone className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-300">
              Campanhas Recomendadas
            </h3>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Sugestões da IA</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
      ) : campaigns.length === 0 ? (
        <p className="text-[10px] text-zinc-600 font-bold uppercase text-center py-4">
          Nenhuma campanha recomendada no momento
        </p>
      ) : (
        <>
          <div className="space-y-2 mb-4 relative">
            {campaigns.map((name, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-zinc-300 flex-1">{name}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onAutoRun}
              disabled={isRunning}
              className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 premium-gradient text-white shadow-lg shadow-primary/20"
            >
              {isRunning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              {isRunning ? "Executando..." : "Criar todas"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/campanhas")}
              className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            >
              Ver campanhas <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Export: AI Dashboard Section ──────────────────────────────────────

export function AIDashboardCards() {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const [suggestaoIA, setSuggestaoIA] = useState("");
  const [clientesEmRisco, setClientesEmRisco] = useState(0);
  const [campanhasRecomendadas, setCampanhasRecomendadas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const fetchInsights = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const insights = await gerarInsightsDashboard(organization.id);
      setSuggestaoIA(insights.suggestaoIA);
      setClientesEmRisco(insights.clientesEmRisco);
      setCampanhasRecomendadas(insights.campanhasRecomendadas);
    } catch (err: any) {
      console.error("[AIDashboardCards] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [organization?.id]);

  const handleAutoReactivation = async () => {
    if (!organization?.id) return;
    setIsRunning(true);
    try {
      const result = await runAutonomousSellCycle(organization.id);
      toast.success(`Reativação automática concluída! ${result.campaignsCreated} campanhas criadas.`);
      fetchInsights(); // Refresh
    } catch (err: any) {
      toast.error("Erro na reativação: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoRunCampaigns = async () => {
    if (!organization?.id) return;
    setIsRunning(true);
    try {
      const result = await runAutonomousSellCycle(organization.id);
      toast.success(`${result.campaignsCreated} campanhas criadas automaticamente!`);
      fetchInsights();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AISuggestionCard
        suggestion={suggestaoIA}
        isLoading={isLoading}
        onRefresh={fetchInsights}
      />
      <ClientsAtRiskCard
        count={clientesEmRisco}
        isLoading={isLoading}
        onAutoReactivation={handleAutoReactivation}
      />
      <RecommendedCampaignsCard
        campaigns={campanhasRecomendadas}
        isLoading={isLoading}
        onAutoRun={handleAutoRunCampaigns}
        isRunning={isRunning}
      />
    </div>
  );
}

export default AIDashboardCards;
