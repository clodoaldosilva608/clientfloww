import { useState } from "react";
import { CheckCircle, XCircle, Clock, Send, LucideIcon, History, Search, Filter, Ban, Loader2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { messageService, MessageLog } from "@/services/message.service";
import { clientService } from "@/services/client.service";
import { campaignService } from "@/services/campaign.service";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageLogWithNames extends MessageLog {
  client_name?: string;
  campaign_name?: string;
}

const statusConfig: Record<string, { label: string; icon: LucideIcon; className: string, color: string, glow: string }> = {
  delivered: { label: "Entregue", icon: CheckCircle, className: "text-success", color: "bg-success/10", glow: "shadow-success/20" },
  sent: { label: "Enviada", icon: Send, className: "text-primary", color: "bg-primary/10", glow: "shadow-primary/20" },
  failed: { label: "Falhou", icon: XCircle, className: "text-destructive", color: "bg-destructive/10", glow: "shadow-destructive/20" },
  pending: { label: "Pendente", icon: Clock, className: "text-warning", color: "bg-warning/10", glow: "shadow-warning/20" },
};

export default function Historico() {
  const [search, setSearch] = useState("");

  const { data: enrichedLogs, isLoading } = useQuery({
    queryKey: ["message-logs"],
    queryFn: async () => {
      const logsData = await messageService.listLogs(100);
      
      if (logsData.length > 0) {
        const [clients, campaigns] = await Promise.all([
          clientService.list(),
          campaignService.list()
        ]);

        const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
        const campaignMap = Object.fromEntries(campaigns.map(c => [c.id, c.name]));

        return logsData.map(log => ({
          ...log,
          client_name: log.client_id ? clientMap[log.client_id] || "Contato Removido" : "Engine Automator",
          campaign_name: log.campaign_id ? campaignMap[log.campaign_id] || "Interação Manual" : "Sistema Alpha",
        }));
      }
      return [];
    }
  });

  const filteredLogs = (enrichedLogs || []).filter(l => 
    l.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.campaign_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <header>
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             <History className="h-8 w-8 text-primary shadow-2xl" />
             <span className="premium-gradient bg-clip-text text-transparent uppercase">Registro de Operações</span>
           </h1>
           <p className="text-muted-foreground mt-1 text-sm font-medium italic">Monitoramento completo da base e dos fluxos de saída.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-11 h-12 glass-card rounded-xl border-none shadow-lg font-bold text-xs" 
            placeholder="Auditar por cliente, mensagem ou fluxos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 w-12 rounded-xl p-0 glass-card border-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="bento-grid">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length > 0 ? filteredLogs.map((log) => {
            const status = statusConfig[log.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={log.id} 
                className="bento-item col-span-12 md:col-span-6 border-l-4 border-l-primary/10 group hover:border-primary/40 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="space-y-1">
                      <h3 className="font-black text-[11px] uppercase tracking-tight text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                        {log.client_name}
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">{log.campaign_name}</p>
                   </div>
                   <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 shadow-sm transition-all ${status.color} ${status.className} ${status.glow} group-hover:scale-105`}>
                      <StatusIcon className="h-3 w-3" /> {status.label}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="text-[11px] text-muted-foreground font-medium italic bg-muted/30 p-4 rounded-xl border border-border/5 leading-relaxed relative">
                     <span className="text-2xl text-primary/20 absolute -top-1 -left-1 font-serif">"</span>
                     {log.message || "Interação técnica sem payload textual."}
                     <span className="text-2xl text-primary/20 absolute -bottom-4 -right-1 font-serif">"</span>
                   </div>

                   <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                         <Badge variant="outline" className="text-[8px] font-black uppercase border-muted-foreground/20 text-muted-foreground px-2 py-0.5">{log.platform || "REST-API"}</Badge>
                         <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                           {new Date(log.created_at).toLocaleString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <div className="text-[9px] font-black text-primary uppercase flex items-center gap-1 cursor-pointer hover:underline tracking-widest">
                        AUDITAR <ArrowUpRight className="h-3 w-3" />
                      </div>
                   </div>
                </div>
              </motion.div>
            );
          }) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-12 py-32 text-center glass-card rounded-[2rem]">
              <div className="h-16 w-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Ban className="h-8 w-8 text-muted" />
              </div>
              <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Nenhuma pegada digital encontrada nos registros de auditoria.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
