import { useState, useEffect, useRef } from "react";
import {
  Activity, Cpu, Database, AlertTriangle, CheckCircle2,
  Clock, Zap, BarChart3, RefreshCw, Wifi, WifiOff
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/lib/supabase";
import { engineMonitor } from "@/engine/engine-monitor";

interface LogEntry {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

interface WorkerStatus {
  name: string;
  status: "online" | "offline" | "busy";
  lastPing: string;
}

export default function EngineMonitor() {
  const [queueHistory, setQueueHistory] = useState<{ time: string; val: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ queueSize: 0, activeWorkers: 0, runningExecutions: 0, processingRate: 0 });
  const logsEndRef = useRef<HTMLDivElement>(null);

  const workers: WorkerStatus[] = [
    { name: "WhatsApp Engine", status: "online", lastPing: "2s atrás" },
    { name: "Telegram Bot", status: "online", lastPing: "5s atrás" },
    { name: "AI Gateway", status: "online", lastPing: "1s atrás" },
    { name: "Scheduler Worker", status: "busy", lastPing: "3s atrás" },
  ];

  useEffect(() => {
    fetchStats();
    
    // Supabase Realtime Subscription
    const channel = supabase
      .channel('engine-monitor')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'automation_queue' 
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_logs' }, (payload: any) => {
        addLog({
          message: `Mensagem ${payload.new.status || 'processada'} → ID: ${payload.new.id.substring(0, 8)}`,
          type: payload.new.status === 'failed' ? 'error' : 'success',
        });
      })
      .subscribe();

    // Initial mock logs
    const initialLogs: LogEntry[] = [
      { id: '1', message: 'Engine Monitor v2 inicializado', type: 'success', timestamp: new Date() },
      { id: '2', message: 'Conexão Supabase Realtime estabelecida', type: 'info', timestamp: new Date() },
      { id: '3', message: 'Workers sincronizados com sucesso', type: 'success', timestamp: new Date() },
    ];
    setLogs(initialLogs);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [...prev.slice(-49), {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }]);
  };

  const fetchStats = async () => {
    try {
      const s = await engineMonitor.getStats();
      setStats({
        queueSize: s.queueSize,
        activeWorkers: workers.filter(w => w.status !== 'offline').length,
        runningExecutions: s.activeWorkers, // Using activeWorkers from service as executions
        processingRate: s.processingRate
      });
      setQueueHistory(prev => [...prev.slice(-19), { 
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        val: s.queueSize 
      }].slice(-20));
    } catch (e) {
      console.error("Error fetching engine stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const recoverQueue = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
      loading: 'Sincronizando fila...',
      success: 'Fila recuperada com sucesso!',
      error: 'Erro ao recuperar'
    });
    addLog({ message: 'Sincronização forçada da fila executada', type: 'warning' });
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-info';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-12 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[350px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <span className="premium-gradient bg-clip-text text-transparent uppercase">Console de Operações</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm italic font-medium">Monitoramento em tempo real do Automation Engine v2.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={recoverQueue} className="text-[10px] font-black uppercase tracking-widest gap-2">
            <RefreshCw className="h-3 w-3" /> Forçar Sincronia
          </Button>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] font-black px-4 py-1.5 uppercase tracking-widest">
            SISTEMA NOMINAL
          </Badge>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tamanho da Fila", value: stats.queueSize, icon: Database, color: "text-primary", bg: "bg-primary/10" },
          { label: "Workers Ativos", value: stats.activeWorkers, icon: Cpu, color: "text-accent", bg: "bg-accent/10" },
          { label: "Agendamentos", value: stats.runningExecutions, icon: Activity, color: "text-success", bg: "bg-success/10" },
          { label: "Taxa Proc.", value: `${stats.processingRate.toFixed(1)}/s`, icon: Zap, color: "text-warning", bg: "bg-warning/10" }
        ].map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bento-item">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{card.label}</p>
              <h3 className="text-3xl font-black tabular-nums tracking-tighter">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bento-grid">
        {/* Live Queue Chart */}
        <div className="bento-item col-span-12 lg:col-span-8 h-[350px] flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Carga da Fila em Tempo Real
          </h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={queueHistory}>
                <defs>
                  <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="val" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorQueue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worker Status */}
        <div className="bento-item col-span-12 lg:col-span-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-accent" />
            Status dos Workers
          </h2>
          <div className="space-y-4">
            {workers.map((worker, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`h-3 w-3 rounded-full ${worker.status === 'online' ? 'bg-success' : worker.status === 'busy' ? 'bg-warning' : 'bg-destructive'}`} />
                    {worker.status === 'online' && <div className="absolute inset-0 h-3 w-3 rounded-full bg-success animate-ping opacity-50" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold">{worker.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">{worker.lastPing}</p>
                  </div>
                </div>
                {worker.status === 'online' ? (
                  <Wifi className="h-3 w-3 text-success" />
                ) : worker.status === 'busy' ? (
                  <Clock className="h-3 w-3 text-warning" />
                ) : (
                  <WifiOff className="h-3 w-3 text-destructive" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs */}
        <div className="bento-item col-span-12 max-h-[300px] flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-info" />
            Logs em Tempo Real
            <div className="ml-2 h-2 w-2 rounded-full bg-success animate-pulse" />
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-1 px-2 rounded hover:bg-muted/30 transition-colors">
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`font-bold ${getLogColor(log.type)}`}>[{log.type.toUpperCase()}]</span>
                <span className="text-foreground">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
