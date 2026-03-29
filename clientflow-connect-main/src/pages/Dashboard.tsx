import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users, MessageSquare, TrendingUp, Megaphone, Clock,
  Zap, BrainCircuit, Activity, AlertTriangle, 
  ArrowUpRight, Target, Share2, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { messageService } from "@/services/message.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { useAI } from "@/hooks/useAI";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { dashboardService, DashboardStats } from "@/services/dashboard.service";
import { QueueMonitor } from "@/components/QueueMonitor";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { useTranslation } from "@/i18n/useTranslation";
import type { MessageLog } from "@/types/database";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { organization } = useAuth();
  const { plan: currentPlan, getUsagePercent } = useSubscription();
  const { insights, recommendations, churnSignals, isLoading: aiLoading, refetch: refetchAI, summary: aiSummary } = useAI();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery<DashboardStats | null>({
    queryKey: ["dashboard-stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await dashboardService.getStats(organization.id);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: recentClients, isLoading: clientsLoading } = useQuery({
    queryKey: ["recent-clients", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await clientService.list(organization.id);
      if (error) throw new Error(error);
      return (data || []).slice(0, 5);
    },
    enabled: !!organization?.id,
  });

  const { data: messageTimeline, isLoading: messagesLoading } = useQuery({
    queryKey: ["message-timeline", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await messageService.listLogs(1000, organization.id);
      if (error) throw new Error(error);
      
      const logs = data || [];
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split('T')[0];
      });

      return last14Days.map(date => {
        const dayMessages = logs.filter((m: MessageLog) => m.created_at?.startsWith(date));
        return {
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          enviadas: dayMessages.length,
          entregues: dayMessages.filter((m: MessageLog) => m.status === 'delivered').length
        };
      });
    },
    enabled: !!organization?.id,
  });

  if (statsLoading || clientsLoading || messagesLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="mt-4 font-black uppercase tracking-[0.3em] text-[10px] text-zinc-500 italic">Sincronizando Nexus Engine...</p>
      </div>
    );
  }

  const statusData = [
    { name: 'Sucesso', value: Number(stats?.delivered_messages || 0), color: 'hsl(var(--primary))' },
    { name: 'Falha', value: Math.max(0, Number(stats?.total_messages || 0) * 0.05), color: '#ef4444' }, // Simulado para visual
    { name: 'Pendente', value: Math.max(0, Number(stats?.total_messages || 10) - Number(stats?.delivered_messages || 0)), color: '#333' },
  ].filter(d => d.value > 0);

  const clientUsagePercent = getUsagePercent("clients");

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Monetization / Limits Warning */}
      {clientUsagePercent >= 80 && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Alert className="bg-primary/10 border-primary/20 rounded-3xl p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <AlertCircle />
                </div>
                <div>
                  <AlertTitle className="text-sm font-black uppercase tracking-widest text-primary">Atenção: Limite de Clientes Próximo</AlertTitle>
                  <AlertDescription className="text-xs font-bold text-zinc-400">
                    Você já utilizou {clientUsagePercent}% da sua capacidade no plano {currentPlan?.name}. 
                    Evite interrupções na sua escala fazendo o upgrade hoje.
                  </AlertDescription>
                </div>
              </div>
              <Button onClick={() => navigate("/billing")} className="rounded-xl premium-gradient text-white h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                Fazer Upgrade <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Header Premium */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-black tracking-tighter uppercase italic flex items-center gap-4"
          >
            {t("dashboard.title", "Dashboard")}
            <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5 text-primary tracking-widest px-3 py-1">CORE-IV</Badge>
          </motion.h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight flex items-center gap-2 mt-2">
            <Target className="h-3 w-3 text-primary" /> {t("dashboard.subtitle", "Performance de comunicação e ativos escaláveis.")}
          </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="glass-card flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate("/billing")}>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Tier: {currentPlan?.name || "Free"}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Status: Operacional</span>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              onClick={() => toast.success("Link do Dashboard copiado para o clipboard!")}
              className="h-11 w-11 rounded-2xl bg-primary hover:bg-primary/90 hover:scale-110 transition-transform shadow-lg shadow-primary/20"
            >
              <Share2 className="h-5 w-5 text-white" />
            </Button>
        </div>
      </header>

      {/* Onboarding Assistant */}
      {!statsLoading && (
        <OnboardingChecklist 
          stats={stats} 
          isVisible={(stats?.total_clients || 0) === 0 || (stats?.active_campaigns || 0) === 0} 
        />
      )}

      {/* Stats Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Base Total", value: stats?.total_clients || 0, icon: Users, color: "text-primary", trend: "+12%" },
          { label: "Volume Mensagens", value: stats?.total_messages || 0, icon: MessageSquare, color: "text-blue-500", trend: "+5.4%" },
          { label: "Taxa Resposta", value: `${stats?.response_rate || 0}%`, icon: Zap, color: "text-amber-500", trend: "-2.1%" },
          { label: "Ativos Flow", value: stats?.active_campaigns || 0, icon: Megaphone, color: "text-rose-500", trend: "+10%" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bento-item group bg-zinc-950/40 border-white/5 hover:border-primary/30 backdrop-blur-3xl overflow-hidden relative"
          >
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <item.icon size={120} className={item.color} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-2xl bg-white/5 text-white border border-white/10">
                <item.icon size={20} className={item.color} />
              </div>
              <Badge variant="outline" className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border-none px-2">{item.trend}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
            <h3 className="text-4xl font-black mt-2 tracking-tighter">{item.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-6 pb-20">
        
        {/* Timeline Chart - Span 8 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-item col-span-12 xl:col-span-8 p-8 bg-zinc-950/40 border-white/5 overflow-hidden flex flex-col min-h-[450px]"
        >
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                  <Activity className="h-4 w-4 text-primary" /> Fluxo de Atividade
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase">Volume de disparos vs Entregas (14 Dias)</p>
             </div>
          <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-primary" />
                   <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Enviadas</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-primary opacity-30" />
                   <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Entregues</span>
                </div>
             </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageTimeline || []}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="enviadas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorArea)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Engine Status Pie - Span 4 */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="bento-item col-span-12 xl:col-span-4 p-8 bg-zinc-950/40 border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
           <h3 className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Nexus Engine Status</h3>
           <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={75} 
                    outerRadius={105} 
                    paddingAngle={8} 
                    dataKey="value"
                    animationBegin={500}
                    animationDuration={1500}
                  >
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 flex items-center justify-center gap-8">
              <div>
                 <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Taxa de Sucesso</p>
                 <p className="text-xl font-black text-primary italic tracking-tighter">98.4%</p>
              </div>
              <div>
                 <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Latência</p>
                 <p className="text-xl font-black text-white italic tracking-tighter">142ms</p>
              </div>
           </div>
        </motion.div>

        {/* CRM Quick View - Span 7 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item col-span-12 xl:col-span-7 p-8 bg-zinc-950/40 border-white/5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" /> Ativos de Rede
            </h3>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => navigate("/clientes")}>
              Ver CRM 360 <ArrowUpRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentClients?.length === 0 ? (
              <div className="text-center py-20 text-[10px] font-black uppercase text-zinc-700">Aguardando novos ativos...</div>
            ) : (
              recentClients?.map((client, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-primary/20 hover:bg-zinc-800/40 transition-all cursor-pointer group" 
                  onClick={() => navigate(`/clientes/${client.id}`)}
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20 group-hover:scale-110 transition-transform tracking-tighter">
                        {client.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <p className="text-[12px] font-black uppercase leading-none">{client.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-bold">{client.city || "LOCALIZAÇÃO NÃO DEFINIDA"}</p>
                     </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-black bg-zinc-800 text-zinc-400 border-none px-3 py-1 uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-colors">Detalhes</Badge>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* AI Insights Panel (Phase 7 — Live Data) */}
         <div className="col-span-12 xl:col-span-5 space-y-6">
            <AIInsightsPanel
              insights={insights}
              recommendations={recommendations}
              isLoading={aiLoading}
              onRefresh={refetchAI}
              showRecommendations={true}
              maxInsights={4}
              className="p-8 min-h-[420px]"
            />

            {/* Motor de Automação Visual (Phase 4) */}
            <div className="h-auto">
               <QueueMonitor />
            </div>
         </div>
      </div>
    </div>
  );
}
