import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Clock, AlertCircle, CheckCircle2, 
  RotateCw, Terminal, Cpu 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AutomationQueue } from "@/types/database";

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-500", icon: Clock, label: "Aguardando" },
  processing: { color: "bg-blue-500/10 text-blue-500 animate-pulse", icon: RotateCw, label: "Em Execução" },
  completed: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2, label: "Finalizado" },
  failed: { color: "bg-rose-500/10 text-rose-500", icon: AlertCircle, label: "Falha Crítica" },
};

export function QueueMonitor() {
  const { organization } = useAuth();

  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ["automation-monitor", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await (supabase as any)
        .from("automation_queue")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as AutomationQueue[];
    },
    enabled: !!organization?.id,
    refetchInterval: 3000, // Phase 4: Monitor dinâmico 3s
  });

  return (
    <div className="bento-item border-l-4 border-l-primary bg-zinc-950/50">
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Vigilância Industrial</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Motor de Automação Ativo</p>
             </div>
          </div>
          <button onClick={() => refetch()} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400">
             <RotateCw className="h-4 w-4" />
          </button>
       </header>

       <div className="space-y-3">
          <AnimatePresence mode="popLayout">
             {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-14 w-full bg-white/5 animate-pulse rounded-xl" />)
             ) : queue?.length === 0 ? (
                <div className="text-center py-6">
                   <p className="text-[10px] font-black uppercase text-zinc-600">Nenhum processo na fila de espera</p>
                </div>
             ) : queue?.map((job) => {
                const StatusIcon = statusConfig[job.status]?.icon || Clock;
                return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     key={job.id} 
                     className="group relative flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all cursor-crosshair overflow-hidden"
                   >
                      {job.status === 'processing' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 animate-pulse" />
                      )}
                      
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${statusConfig[job.status]?.color}`}>
                            <StatusIcon className="h-4 w-4" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-white uppercase tracking-tight">Step: {job.payload?.type || 'Processo'}</p>
                               <span className="text-[9px] text-zinc-600 font-mono">#{job.id.slice(0, 6)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <Cpu className="h-3 w-3 text-zinc-700" />
                               <span className="text-[8px] font-bold uppercase text-zinc-500">Worker: {job.locked_by?.slice(-4) || 'Livre'}</span>
                               <Terminal className="h-3 w-3 text-zinc-700 ml-1" />
                               <span className="text-[8px] font-bold uppercase text-zinc-500">Tentativas: {job.attempts}/{job.max_attempts}</span>
                            </div>
                         </div>
                      </div>

                      <div className="text-right">
                         <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest border-none ${statusConfig[job.status]?.color}`}>
                            {statusConfig[job.status]?.label}
                         </Badge>
                         <p className="text-[8px] text-zinc-600 font-bold mt-1 uppercase">
                            {new Date(job.run_at).toLocaleTimeString('pt-BR')}
                         </p>
                      </div>
                   </motion.div>
                );
             })}
          </AnimatePresence>
       </div>

       {queue && queue.some(j => j.status === 'failed') && (
          <div className="mt-4 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
             <AlertCircle className="h-3 w-3 text-rose-500" />
             <p className="text-[9px] font-black uppercase text-rose-500">Intervenção manual sugerida em 2 jobs falhos</p>
          </div>
       )}
    </div>
  );
}
