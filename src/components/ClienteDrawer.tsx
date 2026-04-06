import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  User, MessageSquare, Tag as TagIcon, 
  StickyNote, Activity, Phone, 
  Mail, MapPin, TrendingUp, AlertCircle, 
  Clock, ShieldCheck, Star, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clientService } from "@/services/client.service";
import { messageService } from "@/services/message.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MessageLog } from "@/types/database";

interface ClienteDrawerProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDrawer({ clientId, open, onOpenChange }: ClienteDrawerProps) {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`client-timeline-${clientId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_logs', filter: `client_id=eq.${clientId}` }, 
        () => queryClient.invalidateQueries({ queryKey: ['client-messages', clientId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, queryClient]);

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await clientService.getById(clientId, organization?.id || '');
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!clientId && open,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['client-messages', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await messageService.listByClient(clientId, client?.organization_id || "");
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!clientId && !!client?.organization_id && open,
  });

  const engagementScore = 92;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-y-auto overflow-x-hidden flex flex-col gap-0 z-[100]">
        
        {loadingClient && (
          <div className="p-8 space-y-6">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        )}

        {!loadingClient && !client && clientId && (
           <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
             <AlertCircle className="h-10 w-10 text-rose-500" />
             <p className="text-zinc-500 text-sm">Cliente não encontrado.</p>
           </div>
        )}

        {!loadingClient && client && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full pb-20">
            {/* Header */}
            <div className="p-6 md:p-8 bg-zinc-900/30 border-b border-white/5 relative">
              <SheetHeader className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl premium-gradient flex items-center justify-center text-xl font-black text-white shadow-lg">
                    {client.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
                      {client.name}
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[9px] px-2 py-0.5 tracking-widest leading-none">Ativo</Badge>
                    </SheetTitle>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-primary" /> Visualização CRM 360
                    </p>
                  </div>
                </div>
              </SheetHeader>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Info Cards Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bento-item p-5 bg-zinc-950/40 border-white/5 rounded-2xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 font-black uppercase flex items-center gap-1"><Phone size={10} className="text-primary"/> WhatsApp</span>
                    <span className="text-xs font-bold text-white uppercase">{client.phone || client.whatsapp_id || "Não definido"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 font-black uppercase flex items-center gap-1"><Mail size={10} className="text-primary"/> Email</span>
                    <span className="text-xs font-bold text-white uppercase break-all">{client.email || "Não definido"}</span>
                  </div>
                </div>
                
                <div className="bento-item p-5 bg-zinc-950/40 border-white/5 rounded-2xl flex flex-col gap-3 justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5">
                    <Star size={80} className="text-amber-500" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                        <svg className="h-full w-full rotate-[-90deg]">
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-900" />
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            className="text-amber-500" 
                            strokeDasharray="125.6"
                            strokeDashoffset={125.6 - (125.6 * engagementScore) / 100}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-[10px] font-black italic">{engagementScore}</p>
                        </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 font-black uppercase">Scoring</span>
                      <span className="text-xs font-black text-amber-500 uppercase">Cliente VIP</span>
                    </div>
                  </div>
                </div>
              </div>

               {/* Tags */}
               <div className="bento-item p-5 bg-zinc-950/40 border-white/5 rounded-2xl space-y-3">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                    <TagIcon size={12} className="text-primary" /> Tags & Segmentação
                 </h3>
                 <div className="flex flex-wrap gap-1.5">
                   {client.tags?.map((tag: string, i: number) => (
                     <Badge key={i} variant="outline" className="text-[9px] font-black border-zinc-800 bg-zinc-900 text-zinc-400 capitalize cursor-default py-0.5">{tag}</Badge>
                   ))}
                   <button className="h-6 px-3 border border-dashed border-zinc-700 rounded-lg text-[9px] font-black text-primary uppercase transition-colors hover:bg-primary/10">+ Add Token</button>
                 </div>
               </div>

               {/* Timeline */}
               <div className="bento-item p-6 bg-zinc-950/40 border-white/5 rounded-2xl min-h-[300px] flex flex-col">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 italic">
                       <Activity className="h-4 w-4 text-primary" /> Timeline Nexus
                     </h3>
                     <Badge variant="outline" className="h-6 rounded-md border-zinc-800 text-[8px] px-2 font-black text-zinc-500 gap-1 uppercase">
                        <Clock size={10} /> Live
                     </Badge>
                  </div>

                  <div className="flex-1 relative pl-6 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-[1px] before:bg-gradient-to-b before:from-primary before:via-zinc-800 before:to-transparent">
                     {loadingMessages ? (
                        <div className="space-y-4"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>
                     ) : messages?.length ? (
                        <div className="space-y-4">
                           <AnimatePresence>
                              {messages.map((msg: MessageLog, i: number) => (
                                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="relative flex gap-4">
                                    <div className="absolute -left-[18px] top-1 h-4 w-4 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center z-10 shadow-xl">
                                       <Activity size={8} className="text-primary" />
                                    </div>
                                    <div className="flex-1 p-3 rounded-2xl bg-zinc-900/40 border border-white/5">
                                       <div className="flex items-center justify-between mb-1">
                                          <span className={`text-[8px] font-black uppercase tracking-widest ${msg.status === 'delivered' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                             {msg.status} - {msg.platform || 'NEXUS'}
                                          </span>
                                          <span className="text-[8px] font-bold text-zinc-500 uppercase">{new Date(msg.created_at!).toLocaleString()}</span>
                                       </div>
                                       <p className="text-[11px] text-zinc-300 font-medium leading-relaxed italic">"{msg.message}"</p>
                                    </div>
                                 </motion.div>
                              ))}
                           </AnimatePresence>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                           <MessageSquare size={24} className="text-zinc-700 mb-2" />
                           <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">Nenhuma interação.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* AI Action Box */}
               <div className="bento-item p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col gap-3">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                    <TrendingUp size={12} /> Ação Sugerida (Nexus AI)
                 </h3>
                 <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                   Baseado na baixa atividade recente, sugerimos uma <strong className="text-white">Campanha de Reativação</strong> segmentada por este perfil.
                 </p>
                 <Button className="mt-2 text-[9px] font-black uppercase tracking-widest h-8 rounded-lg">Executar Campanha Relâmpago</Button>
               </div>
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}
