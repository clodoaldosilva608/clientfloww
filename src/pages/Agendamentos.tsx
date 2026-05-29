import { CalendarClock, Users, Clock, Trash2, Zap, Target, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { campaignService } from "@/services/campaign.service";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";

export default function Agendamentos() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { data: [], error: null };
      return await campaignService.list(organization.id);
    },
    enabled: !!organization?.id
  });

  const appointments = (campaigns?.data || []).filter(c => c.status === "scheduled");

  const cancelMutation = useMutation({
    mutationFn: (id: string) => {
      if (!organization?.id) throw new Error("Unauthorized");
      return campaignService.updateStatus(id, organization.id, "draft");
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado (movido para rascunhos)");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento");
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <header>
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8"
    >
      <header>
         <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
           <CalendarClock className="h-8 w-8 text-warning fill-current" />
           <span className="premium-gradient bg-clip-text text-transparent uppercase">Linha do Tempo</span>
         </h1>
         <p className="text-muted-foreground mt-1 text-sm font-medium">Sua orquestra de envios programados em tempo real.</p>
      </header>

      <div className="bento-grid">
        <AnimatePresence mode="popLayout">
          {appointments.length > 0 ? appointments.map((item) => (
            <motion.div 
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              key={item.id} 
              className="bento-item col-span-12 md:col-span-6 lg:col-span-4 border-l-4 border-l-warning group hover:border-warning/50 transition-all bg-warning/5"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-warning/20 rounded-xl shadow-lg shadow-warning/10">
                       <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                       <h3 className="font-black text-xs uppercase tracking-tight group-hover:text-warning transition-colors">{item.name}</h3>
                       <Badge variant="outline" className="text-[8px] font-black uppercase border-warning/30 text-warning mt-1">{item.platform}</Badge>
                    </div>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   disabled={cancelMutation.isPending}
                   onClick={() => {
                     if(confirm('Cancelar este agendamento?')) {
                        cancelMutation.mutate(item.id);
                     }
                   }}
                   className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                 >
                    {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                 </Button>
              </div>

              <div className="space-y-6">
                 <div className="p-4 bg-muted/40 rounded-xl italic text-xs text-muted-foreground line-clamp-2 border border-border/5 font-medium leading-relaxed">
                    "{item.message}"
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-6">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Calendário</span>
                          <span className="text-[11px] font-black uppercase text-foreground">
                             {new Date(item.scheduled_at || "").toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                          </span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Timing</span>
                          <span className="text-[11px] font-black uppercase text-foreground">
                             {new Date(item.scheduled_at || "").toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                       </div>
                    </div>
                    <div className="bg-warning text-warning-foreground px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-warning/20">
                       <Target className="h-3.5 w-3.5 fill-current" />
                       <span className="text-[10px] font-black uppercase tracking-tighter">{item.target_count} ALVOS</span>
                    </div>
                 </div>
              </div>

              <div className="absolute top-4 right-4">
                 <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                 </div>
              </div>
            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-12 py-32 text-center glass-card rounded-[2rem]">
              <div className="h-16 w-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CalendarClock className="h-8 w-8 text-muted" />
              </div>
              <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Nenhum agendamento pendente no pipeline de execução.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
