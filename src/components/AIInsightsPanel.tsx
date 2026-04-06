/**
 * src/components/AIInsightsPanel.tsx
 * Phase 7 — AI Insights Panel Component
 *
 * A premium panel that surfaces AI-generated insights and recommendations
 * in the Dashboard and other pages.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BrainCircuit, TrendingUp, AlertTriangle, Clock, Zap,
  Users, Target, ArrowRight, RefreshCw, ChevronRight,
  CheckCircle2, AlertCircle, Info, Sparkles
} from "lucide-react";
import type { AIInsight, AIRecommendation } from "@/ai/types";

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
    icon: AlertCircle,
    dot: "bg-red-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    icon: AlertTriangle,
    dot: "bg-amber-500",
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
    icon: Info,
    dot: "bg-blue-500",
  },
};

const TYPE_ICONS: Record<string, any> = {
  churn_risk: Users,
  best_hour: Clock,
  channel: TrendingUp,
  vip_inactive: Target,
  campaign_suggestion: Zap,
  performance: TrendingUp,
  trend: TrendingUp,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const navigate = useNavigate();
  const config = SEVERITY_CONFIG[insight.severity];
  const TypeIcon = TYPE_ICONS[insight.type] || BrainCircuit;
  const SevIcon = config.icon;

  const handleAction = () => {
    if (!insight.action) return;
    if (insight.action.type === "navigate") {
      navigate(insight.action.payload?.path || "/");
    } else if (insight.action.type === "create_campaign") {
      navigate("/campanhas", { state: { autoStart: true, prompt: insight.action.payload?.promptSuggestion } });
    } else if (insight.action.type === "open_crm") {
      navigate("/clientes");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`p-4 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3 group hover:opacity-90 transition-opacity`}
    >
      <div className={`h-9 w-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <TypeIcon className={`h-4 w-4 ${config.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h4 className={`text-[11px] font-black uppercase tracking-tight ${config.text} leading-tight`}>
              {insight.title}
            </h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={`h-3 w-3 ${config.text} cursor-help opacity-70 hover:opacity-100`} />
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] text-white p-3 max-w-[200px]">
                  <p><strong>Lógica da IA:</strong> {insight.metadata?.rationale || insight.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className={`h-1.5 w-1.5 rounded-full ${config.dot} shrink-0 mt-1.5 animate-pulse`} />
        </div>
        <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-relaxed">
          {insight.description}
        </p>
        {insight.action && (
          <button
            onClick={handleAction}
            className={`mt-2 text-[9px] font-black uppercase tracking-widest ${config.text} flex items-center gap-1 hover:gap-2 transition-all`}
          >
            {insight.action.label} <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({ rec, index }: { rec: AIRecommendation; index: number }) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (rec.action.type === "navigate") navigate(rec.action.payload?.path || "/");
    else if (rec.action.type === "create_campaign") navigate("/campanhas", { state: { autoStart: true } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="p-4 rounded-2xl border border-white/5 bg-zinc-900/40 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[11px] font-black uppercase tracking-tight text-zinc-200 leading-tight">
          {rec.title}
        </h4>
        <Badge className={`text-[8px] font-black uppercase border shrink-0 ${PRIORITY_COLORS[rec.priority]}`}>
          {rec.priority}
        </Badge>
      </div>
      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
        {rec.rationale}
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
          ↑ {rec.expectedImpact}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAction}
          className="h-7 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-3"
        >
          {rec.action.label} <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-2xl border border-white/5 bg-zinc-900/40 flex gap-3">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AIInsightsPanelProps {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  isLoading: boolean;
  onRefresh?: () => void;
  className?: string;
  showRecommendations?: boolean;
  maxInsights?: number;
}

export function AIInsightsPanel({
  insights,
  recommendations,
  isLoading,
  onRefresh,
  className = "",
  showRecommendations = true,
  maxInsights = 5,
}: AIInsightsPanelProps) {
  const visibleInsights = insights.slice(0, maxInsights);

  return (
    <div className={`bento-item bg-zinc-950/40 border-white/5 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-2">
              Nexus AI
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
              {insights.length} insight{insights.length !== 1 ? "s" : ""} ativos
            </p>
          </div>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 rounded-xl hover:bg-primary/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {isLoading ? (
          <PanelSkeleton />
        ) : insights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
              <BrainCircuit className="h-7 w-7 text-zinc-700" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Aguardando dados suficientes
            </p>
            <p className="text-[9px] text-zinc-700 mt-1">
              Cadastre clientes e envie campanhas para gerar insights.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {visibleInsights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Recommendations Section */}
      {showRecommendations && recommendations.length > 0 && !isLoading && (
        <>
          <div className="my-4 border-t border-white/5" />
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3 flex items-center gap-2">
              <Target className="h-3 w-3" /> Recomendações Prioritárias
            </h4>
            <div className="space-y-3">
              <AnimatePresence>
                {recommendations.slice(0, 2).map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
