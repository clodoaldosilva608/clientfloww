import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  User, MessageSquare, Calendar, Tag as TagIcon, 
  StickyNote, ArrowLeft, Activity, Phone, 
  Mail, MapPin, TrendingUp, AlertCircle, 
  Zap, Clock, ShieldCheck, Star
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { clientService } from "@/services/client.service";
import { messageService } from "@/services/message.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client, MessageLog } from "@/types/database";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 }
  }
};

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`client-timeline-${id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_logs', filter: `client_id=eq.${id}` }, 
        () => queryClient.invalidateQueries({ queryKey: ['client-messages', id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await clientService.getById(id!, organization?.id || '');
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!id,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['client-messages', id],
    queryFn: async () => {
      const { data, error } = await messageService.listByClient(id!, client?.organization_id || "");
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!id && !!client?.organization_id,
  });

  if (loadingClient) {
    return (
      <div className="p-8 space-y-10">
        <div className="flex items-center gap-4 animate-pulse">
           <Skeleton className="h-10 w-10 rounded-xl" />
           <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] col-span-1 rounded-3xl" />
          <Skeleton className="h-[600px] col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!client) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
      <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center">
         <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <div>
         <h2 className="text-2xl font-black uppercase tracking-tight">Ativo não identificado</h2>
         <p className="text-zinc-500 text-sm mt-1">Este ID não consta no Nexus Data Flow da sua organização.</p>
      </div>
      <Button onClick={() => navigate("/clientes")} className="rounded-2xl px-8 uppercase font-black tracking-widest h-12">Voltar para o CRM</Button>
    </div>
  );

  const engagementScore = 92; // Phase 5 Mock logic - based on interactions

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 space-y-10 pb-24 max-w-[1400px] mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-primary hover:text-white transition-all" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-4xl font-black tracking-tighter uppercase italic">{client.name}</h1>
               <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[10px] font-black px-3 py-1 tracking-widest">Ativo</Badge>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
               <ShieldCheck className="h-3 w-3 text-primary" /> Visualização CRM 360 - Nexus One
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl border-white/5 bg-zinc-900/50 uppercase font-black text-[10px] h-12 tracking-widest px-6 italic">Arquivar Ativo</Button>
           <Button className="rounded-2xl bg-primary uppercase font-black text-[10px] h-12 tracking-widest px-6 italic shadow-lg shadow-primary/20">Iniciar Automação</Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: CRM Identity & Stats */}
        <div className="col-span-12 xl:col-span-4 space-y-8">
           {/* Info Card */}
           <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5 backdrop-blur-3xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8 border-b border-white/5 pb-4 italic">Identidade do Ativo</h3>
              <div className="space-y-6">
                {[
                  { icon: Phone, label: "Contato Principal", value: client.phone || "Indisponível" },
                  { icon: Mail, label: "E-mail Sync", value: client.email || "Não vinculado" },
                  { icon: MapPin, label: "Geolocalização", value: client.city || "Manual" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-3 text-zinc-500 mb-1">
                       <item.icon size={12} className="text-primary" />
                       <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight pl-6">{item.value}</span>
                  </div>
                ))}
              </div>
           </motion.div>

           {/* Engagement Score Card */}
           <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-8 opacity-5">
                 <Star size={120} className="text-amber-500" />
              </div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic leading-none">Scoring Engagement</h3>
                <Badge className="bg-amber-500/10 text-amber-500 border-none font-black px-2">{engagementScore}%</Badge>
              </div>
              
              <div className="flex items-center gap-8">
                 {/* Progress Circle SVG */}
                 <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                    <svg className="h-full w-full rotate-[-90deg]">
                       <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900" />
                       <motion.circle 
                         cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                         className="text-amber-500" 
                         strokeDasharray="251.2"
                         strokeDashoffset="251.2"
                         animate={{ strokeDashoffset: 251.2 - (251.2 * engagementScore) / 100 }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <p className="text-xl font-black italic">{engagementScore}</p>
                       <p className="text-[8px] font-black text-zinc-600 uppercase">Points</p>
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-zinc-300 leading-tight">Cliente VIP Detectado</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2 leading-relaxed italic">
                       Alta frequência de resposta e interações positivas nos últimos disparos.
                    </p>
                 </div>
              </div>
           </motion.div>

           {/* Tag management */}
           <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 italic flex items-center gap-2">
                 <TagIcon size={12} /> Tags & Segmentação
              </h3>
              <div className="flex flex-wrap gap-2">
                 {client.tags?.map((tag: string, i: number) => (
                   <Badge key={i} variant="outline" className="text-[10px] font-black border-zinc-800 bg-zinc-900 text-zinc-400 capitalize hover:bg-primary transition-colors cursor-default">{tag}</Badge>
                 ))}
                 <button className="h-6 px-3 border border-dashed border-zinc-700 rounded-lg text-[9px] font-black text-zinc-500 uppercase hover:border-primary hover:text-primary transition-colors">+ Add Token</button>
              </div>
           </motion.div>
        </div>

        {/* Right Column: Timeline Intelligence */}
        <div className="col-span-12 xl:col-span-8 space-y-8">
           <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                      <Activity className="h-4 w-4 text-primary" /> Timeline de Ativos
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase italic">Log sequencial de interações e eventos via Nexus Flow.</p>
                 </div>
                 <Badge variant="outline" className="h-8 rounded-xl border-zinc-800 text-[10px] px-4 font-black text-zinc-400 gap-2">
                    <Clock size={12} /> Live Updates On
                 </Badge>
              </div>

              <div className="flex-1 relative pl-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary before:via-zinc-800 before:to-transparent">
                 {loadingMessages ? (
                    <div className="space-y-6"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>
                 ) : messages?.length ? (
                    <div className="space-y-8">
                       <AnimatePresence>
                          {messages.map((msg, i) => (
                             <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i} 
                                className="group relative flex gap-6"
                             >
                                <div className="absolute -left-[27px] top-1 h-6 w-6 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center z-10 transition-transform group-hover:scale-125 group-hover:border-primary shadow-xl">
                                   <MessageSquare size={10} className="text-primary" />
                                </div>
                                <div className="flex-1 p-5 rounded-3xl bg-zinc-900/40 border border-white/5 group-hover:border-primary/20 transition-all hover:bg-zinc-800/40">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                         <span className={`text-[10px] font-black uppercase tracking-widest ${msg.status === 'delivered' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            Mensagem {msg.status}
                                         </span>
                                         <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                         <span className="text-[9px] font-black text-zinc-600 uppercase">{msg.platform || 'NEXUS-SYS'}</span>
                                      </div>
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase">{new Date(msg.created_at!).toLocaleString()}</span>
                                   </div>
                                   <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{msg.message}"</p>
                                </div>
                             </motion.div>
                          ))}
                       </AnimatePresence>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                       <Clock size={40} className="text-zinc-800 mb-4 opacity-20" />
                       <p className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.2em] italic">Aguardando interações via motor de automação...</p>
                    </div>
                 )}
              </div>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5 flex flex-col justify-between">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 italic flex items-center gap-2">
                       <StickyNote size={12} /> Nexus Internal Memo
                    </h3>
                    <textarea 
                       value={note}
                       onChange={(e) => setNote(e.target.value)}
                       className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-800 italic"
                       placeholder="Escrever insight sobre este ativo..."
                    />
                 </div>
                 <Button className="mt-6 w-full h-12 rounded-2xl bg-zinc-800 hover:bg-primary text-[10px] font-black uppercase tracking-widest italic transition-colors">Confirmar Memo</Button>
              </motion.div>

              <motion.div variants={itemVariants} className="bento-item p-8 bg-zinc-950/40 border-white/5 relative overflow-hidden flex flex-col items-center justify-center text-center">
                 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <TrendingUp className="h-8 w-8 text-primary" />
                 </div>
                 <h4 className="text-sm font-black uppercase tracking-[0.2em] italic mb-2">Engajamento Predict</h4>
                 <p className="text-[10px] font-bold text-zinc-500 leading-relaxed max-w-[200px] uppercase italic">
                    Baseado nos logs, este cliente tem 85% de chance de converter na próxima campanha.
                 </p>
                 <Badge className="mt-6 bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-widest px-4 py-2 italic rounded-full pointer-events-none">Alta Probabilidade</Badge>
              </motion.div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
