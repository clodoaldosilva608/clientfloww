/**
 * src/pages/AIAnalytics.tsx
 * Phase 7 — AI Analytics Hub Page
 *
 * Dedicated page for:
 * - Engagement score overview + distribution
 * - Churn risk management center
 * - Best send hour + channel performance
 * - Full recommendations list
 * - Auto-trigger controls for churn response
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { respondToChurnSignals, autoTagChurnClients } from "@/ai/churn-responder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BrainCircuit, TrendingUp, Clock, Users,
  Zap, RefreshCw, Target, Play, Tag,
  ShieldAlert, CheckCircle2, BarChart2, Sparkles, Crown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ─── Engagement Tier Colors ───────────────────────────────────────────────────

const TIER_CONFIG = {
  vip:  { label: "VIP",     color: "text-yellow-400", bg: "bg-yellow-400/10", bar: "#facc15", range: "80-100" },
  hot:  { label: "Quente",  color: "text-orange-400", bg: "bg-orange-400/10",  bar: "#fb923c", range: "55-79" },
  warm: { label: "Morno",   color: "text-blue-400",   bg: "bg-blue-400/10",    bar: "#60a5fa", range: "30-54" },
  cold: { label: "Frio",    color: "text-zinc-400",   bg: "bg-zinc-800",       bar: "#52525b", range: "0-29"  },
};

const RISK_CONFIG = {
  critical: { label: "Crítico",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"   },
  high:     { label: "Alto",     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  medium:   { label: "Médio",    color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"  },
  low:      { label: "Baixo",    color: "text-zinc-400",   bg: "bg-zinc-500/10",   border: "border-zinc-500/20"  },
};

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bento-item bg-zinc-950/40 border-white/5 flex flex-col justify-between p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-2xl ${color}/10 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black tracking-tighter">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">{label}</p>
        {sub && <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Engagement Distribution Chart ───────────────────────────────────────────

function EngagementDistribution({ scores }: { scores: any[] }) {
  const counts = { vip: 0, hot: 0, warm: 0, cold: 0 };
  for (const s of scores) counts[s.tier as keyof typeof counts]++;

  const data = (Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(
    ([tier, cfg]) => ({ name: cfg.label, value: counts[tier], fill: cfg.bar })
  );

  return (
    <div className="bento-item bg-zinc-950/40 border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" /> Distribuição de Engajamento
          </h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{scores.length} clientes analisados</p>
        </div>
        <div className="flex gap-2">
          {(Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tier, cfg]) => (
            <div key={tier} className={`px-2 py-1 rounded-lg ${cfg.bg} flex items-center gap-1.5`}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.bar }} />
              <span className={`text-[8px] font-black uppercase ${cfg.color}`}>{cfg.label}: {counts[tier]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10, fontWeight: "bold" }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: "#09090b", border: "1px solid #1f1f23", borderRadius: "12px" }}
              itemStyle={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "900" }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Churn Risk Table ─────────────────────────────────────────────────────────

function ChurnRiskTable({ signals, onAutoRespond, onAutoTag, isResponding }: {
  signals: any[];
  onAutoRespond: () => void;
  onAutoTag: () => void;
  isResponding: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all"
    ? signals
    : signals.filter(s => s.riskLevel === filter);

  return (
    <div className="bento-item bg-zinc-950/40 border-white/5 p-6 col-span-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" /> Central de Churn Risk
          </h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
            {signals.length} cliente{signals.length !== 1 ? "s" : ""} em risco detectado{signals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filters */}
          <div className="flex gap-1">
            {["all", "critical", "high", "medium"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[8px] px-2.5 py-1.5 rounded-xl font-black uppercase transition-all ${
                  filter === f ? "bg-primary text-white" : "bg-muted/50 text-zinc-500 hover:bg-muted"
                }`}
              >
                {f === "all" ? `Todos (${signals.length})` : f}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 border-amber-500/20 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            onClick={onAutoTag}
            disabled={isResponding || signals.length === 0}
          >
            <Tag className="h-3 w-3" /> Auto-Taguear
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-xl text-[9px] font-black uppercase gap-1.5 premium-gradient text-white shadow-lg shadow-primary/20"
            onClick={onAutoRespond}
            disabled={isResponding || signals.length === 0}
          >
            {isResponding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Auto-Disparar Reativação
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                Nenhum cliente nesta categoria de risco
              </p>
            </div>
          ) : (
            filtered.map((signal, i) => {
              const cfg = RISK_CONFIG[signal.riskLevel as keyof typeof RISK_CONFIG];
              return (
                <motion.div
                  key={signal.clientId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center justify-between p-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl premium-gradient flex items-center justify-center text-[10px] font-black text-white">
                      {(signal.clientName || "X").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-tight ${cfg.color}`}>
                        {signal.clientName}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold mt-0.5">
                        {Math.round(signal.daysInactive)} dias inativo · {signal.deliveryRate}% entrega · Score {signal.engagementScore}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[7px] font-black uppercase border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </Badge>
                    <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 text-zinc-500">
                      {signal.suggestedAction}
                    </Badge>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Best Send Window Card ────────────────────────────────────────────────────

function BestSendCard({ window: win }: { window: any }) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  if (!win) return null;

  return (
    <div className="bento-item bg-zinc-950/40 border-white/5 p-6 flex flex-col">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-primary" /> Janela Ideal de Envio
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="h-24 w-24 rounded-3xl premium-gradient flex items-center justify-center shadow-2xl shadow-primary/30">
          <div className="text-center">
            <p className="text-3xl font-black text-white leading-none">{win.hour}h</p>
            <p className="text-[8px] font-black text-white/70 uppercase tracking-widest">{days[win.dayOfWeek]}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-primary">{win.avgDeliveryRate}%</p>
          <p className="text-[9px] font-black uppercase text-zinc-500">taxa de entrega nesse horário</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="h-1.5 rounded-full bg-zinc-800 flex-1 max-w-[80px]">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(win.confidence * 100)}%` }}
              />
            </div>
            <span className="text-[8px] font-black text-zinc-600">{Math.round(win.confidence * 100)}% conf.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Channel Performance ──────────────────────────────────────────────────────

function ChannelCard({ channels }: { channels: any[] }) {
  const CH_COLORS: Record<string, string> = {
    whatsapp: "#22c55e",
    telegram: "#3b82f6",
    instagram: "#ec4899",
  };

  return (
    <div className="bento-item bg-zinc-950/40 border-white/5 p-6">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" /> Performance por Canal
      </h3>
      <div className="space-y-4">
        {channels.length === 0 ? (
          <p className="text-[10px] text-zinc-700 font-black uppercase text-center py-8">
            Sem dados suficientes
          </p>
        ) : (
          channels.map((ch, i) => (
            <motion.div
              key={ch.channel}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: CH_COLORS[ch.channel] }}>
                  {ch.channel}
                </span>
                <span className="text-[10px] font-black">{ch.deliveryRate}% entrega</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ch.deliveryRate}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: CH_COLORS[ch.channel] }}
                />
              </div>
              <p className="text-[8px] text-zinc-600 mt-1 font-bold">{ch.totalSent} mensagens enviadas</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAnalytics() {
  const navigate = useNavigate();
  const { organization, user } = useAuth();
  const { analysis, insights, recommendations, churnSignals, isLoading, refetch } = useAI();
  const [isResponding, setIsResponding] = useState(false);

  const handleAutoRespond = async () => {
    if (!organization?.id) return;
    setIsResponding(true);
    try {
      const result = await respondToChurnSignals(churnSignals, {
        organizationId: organization.id,
        maxTriggersPerRun: 15,
      });
      if (result.triggered > 0) {
        toast.success(`${result.triggered} fluxo${result.triggered > 1 ? "s" : ""} de reativação disparado${result.triggered > 1 ? "s" : ""}!`, {
          description: `${result.skipped} cliente${result.skipped !== 1 ? "s" : ""} já processado${result.skipped !== 1 ? "s" : ""} recentemente.`,
        });
      } else {
        toast.info("Nenhum novo fluxo disparado.", { description: "Todos os clientes já foram processados recentemente (cooldown de 24h)." });
      }
    } catch (e: any) {
      toast.error("Erro ao disparar fluxos: " + e.message);
    } finally {
      setIsResponding(false);
    }
  };

  const handleAutoTag = async () => {
    if (!organization?.id || !user?.id) return;
    const tagged = await autoTagChurnClients(churnSignals, organization.id, user.id);
    if (tagged > 0) {
      toast.success(`✅ ${tagged} clientes tagueados como 'reativacao_necessaria'`);
    } else {
      toast.info("Todos os clientes críticos já possuem essa tag.");
    }
  };

  const scores = analysis?.engagementScores || [];
  const vipCount = scores.filter(s => s.tier === "vip").length;
  const criticalCount = churnSignals.filter(s => s.riskLevel === "critical").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <BrainCircuit className="h-9 w-9 text-primary" />
            <span className="premium-gradient bg-clip-text text-transparent uppercase">Nexus AI</span>
            <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3">
              BETA
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Inteligência preditiva para máxima retenção e conversão.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-10 px-4 font-black uppercase text-[10px] gap-2 glass-card border-white/5"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
          <Button
            className="rounded-xl h-10 px-5 premium-gradient text-white font-black uppercase text-[10px] shadow-xl shadow-primary/20 gap-2"
            onClick={() => navigate("/campanhas", { state: { autoStart: true } })}
          >
            <Zap className="h-4 w-4" /> Nova Campanha IA
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <SummaryCard label="Clientes Analisados" value={analysis?.summary?.totalClients || 0} icon={Users} color="text-primary" />
            <SummaryCard label="Score Médio" value={`${analysis?.summary?.avgEngagementScore || 0}/100`} icon={Sparkles} color="text-yellow-400" sub="Engajamento geral da base" />
            <SummaryCard label="Churn Risk" value={criticalCount} icon={ShieldAlert} color="text-red-400" sub="Clientes em risco crítico" />
            <SummaryCard label="Clientes VIP" value={vipCount} icon={Crown} color="text-yellow-400" sub="Score acima de 80" />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Engagement Distribution */}
        <div className="col-span-12 lg:col-span-6">
          {isLoading ? <Skeleton className="h-[320px] rounded-3xl" /> : <EngagementDistribution scores={scores} />}
        </div>

        {/* Best Send + Channel */}
        <div className="col-span-12 lg:col-span-3">
          {isLoading ? <Skeleton className="h-[320px] rounded-3xl" /> : <BestSendCard window={analysis?.bestSendWindow} />}
        </div>
        <div className="col-span-12 lg:col-span-3">
          {isLoading ? <Skeleton className="h-[320px] rounded-3xl" /> : <ChannelCard channels={analysis?.channelPerformance || []} />}
        </div>

        {/* Churn Risk Table */}
        <div className="col-span-12">
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-3xl" />
          ) : (
            <ChurnRiskTable
              signals={churnSignals}
              onAutoRespond={handleAutoRespond}
              onAutoTag={handleAutoTag}
              isResponding={isResponding}
            />
          )}
        </div>

        {/* Insights + Recommendations side by side */}
        <div className="col-span-12 lg:col-span-8">
          <AIInsightsPanel
            insights={insights}
            recommendations={recommendations}
            isLoading={isLoading}
            onRefresh={refetch}
            showRecommendations={true}
            maxInsights={10}
            className="p-6 min-h-[500px]"
          />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bento-item bg-zinc-950/40 border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" /> Recomendações Ativas
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
              ) : recommendations.length === 0 ? (
                <p className="text-[10px] text-zinc-700 font-black uppercase text-center py-8">
                  Sem recomendações no momento
                </p>
              ) : (
                recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-3 rounded-2xl border border-white/5 bg-zinc-900/40 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-tight text-zinc-200">{rec.title}</p>
                      <Badge className={`text-[7px] font-black uppercase border shrink-0 ${
                        rec.priority === "urgent" ? "border-red-500/20 text-red-400 bg-red-500/10" :
                        rec.priority === "high"   ? "border-amber-500/20 text-amber-400 bg-amber-500/10" :
                        "border-zinc-500/20 text-zinc-400 bg-zinc-500/10"
                      }`}>{rec.priority}</Badge>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-bold leading-relaxed">{rec.rationale.substring(0, 80)}...</p>
                    <p className="text-[8px] text-emerald-400 font-black mt-1.5">↑ {rec.expectedImpact}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
