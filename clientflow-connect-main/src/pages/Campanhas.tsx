import { useState, useEffect } from "react";
import { 
  Plus, Send, MessageSquare, Trash2, 
  Search, Users, Wand2, Loader2, ArrowLeft, 
  Smartphone, Target, Zap, Clock, 
  CheckCircle2, AlertCircle, TrendingUp, BrainCircuit, MessageCircle, Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { campaignService } from "@/services/campaign.service";
import { clientService } from "@/services/client.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  sent: { label: "Concluída", color: "text-success bg-success/10", icon: CheckCircle2 },
  scheduled: { label: "Agendada", color: "text-warning bg-warning/10", icon: Clock },
  draft: { label: "Rascunho", color: "text-muted-foreground bg-muted", icon: AlertCircle },
};

export default function Campanhas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { canUse, isLoading: subLoading } = useSubscription();
  const [showForm, setShowForm] = useState(location.state?.autoStart || false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"builder" | "audience">("builder");

  useEffect(() => {
    console.log("[Phase 2] Campanhas Page Mounted - Org:", organization?.id);
  }, [organization?.id]);

  // Form State
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const [aiPrompt, setAiPrompt] = useState(location.state?.prompt || "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Audience & Search State
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await campaignService.list(organization.id);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await clientService.list(organization.id);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!organization?.id && (step === "audience" || showForm),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("Unauthorized");
      const { data, error } = await campaignService.delete(id, organization.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success("Campanha removida");
      queryClient.invalidateQueries({ queryKey: ["campaigns", organization?.id] });
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    }
  });

  const generateAiMessage = async () => {
    if (!aiPrompt.trim()) return toast.error("Diga à IA o que você quer comunicar");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-text", {
        body: { prompt: aiPrompt, platform, tone: "premium/persuasivo" }
      });
      if (error) throw error;
      setMessage(data.text);
      toast.success("ClientFlow interpretou seu desejo com sucesso!");
    } catch (e: any) {
      toast.error("Erro na IA: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!canUse("campaigns")) return toast.error("Limite de campanhas atingido!");
    if (!canUse("messages_per_month")) return toast.error("Limite de mensagens do mês atingido!");
    if (selectedClients.length === 0) return toast.error("Selecione a audiência");
    setSaving(true);

    try {
      let scheduled_at = scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null;
      
      const { data, error } = await campaignService.create(organization.id, {
        name, message, platform: platform as any, status: (scheduled_at ? "scheduled" : "draft") as any, scheduled_at: scheduled_at || undefined
      }, selectedClients);

      if (error) throw new Error(error);

      toast.success("Campanha de Mensagem estabelecida!");
      setShowForm(false);
      setName("");
      setMessage("");
      setSelectedClients([]);
      queryClient.invalidateQueries({ queryKey: ["campaigns", organization?.id] });
    } catch (error: any) {
      toast.error("Erro ao criar campanha");
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = (clients || []).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  if (campaignsLoading && !showForm) {
    return (
      <div className="p-6 space-y-8">
        <header className="flex justify-between items-end">
           <Skeleton className="h-12 w-64" />
           <Skeleton className="h-12 w-48" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             <span className="premium-gradient bg-clip-text text-transparent uppercase">Fluxos de Campanhas</span>
           </h1>
           <p className="text-muted-foreground mt-1 text-sm font-medium">Orquestre suas comunicações com precisão cirúrgica.</p>
        </div>
        {!showForm && (
          <Button onClick={() => { 
            if (!canUse("campaigns")) {
              return toast.error("Limite de campanhas atingido!", {
                description: "Faça upgrade para criar novos fluxos.",
                action: { label: "Planos", onClick: () => navigate("/billing") }
              });
            }
            setShowForm(true); 
            setStep("builder"); 
          }} className="rounded-xl h-12 px-6 premium-gradient text-white font-black shadow-xl shadow-primary/20 gap-2">
            <Plus className="h-5 w-5" /> CRIAR NOVO FLUXO
          </Button>
        )}
      </header>

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <header className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
               <h2 className="text-xl font-black uppercase tracking-tight">{step === "builder" ? "1. Construção Visual" : "2. Seleção de Audiência"}</h2>
            </header>

            {(!canUse("campaigns") || !canUse("messages_per_month")) && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 rounded-2xl mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-red-500">Limite Crítico</AlertTitle>
                <AlertDescription className="text-xs font-bold text-zinc-400">
                  Seu plano atingiu o limite permitido. Por favor, 
                  <button type="button" onClick={() => navigate("/billing")} className="text-primary ml-1 underline">faça upgrade</button>
                  para continuar.
                </AlertDescription>
              </Alert>
            )}

            {step === "builder" ? (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                <div className="bento-item space-y-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Identificação da Campanha</Label>
                    <Input className="glass-card font-bold" placeholder="Ex: Lançamento Coleção Inverno" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["whatsapp", "telegram", "instagram"].map(p => (
                      <button key={p} onClick={() => setPlatform(p)} className={`h-12 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all ${platform === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted/50 hover:bg-muted'}`}>
                        {p === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                        {p === 'telegram' && <Send className="h-4 w-4" />}
                        {p === 'instagram' && <Instagram className="h-4 w-4" />}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bento-item border-l-4 border-l-primary relative bg-primary/5">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4" /> ClientFlow AI Copilot
                    </Label>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 rounded-full">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                       <span className="text-[9px] font-black text-primary uppercase">Módulo Ativo</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Input className="glass-card text-xs font-bold" placeholder="Diga o que você quer: 'Crie uma oferta vip para sapatos'..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                    <Button onClick={generateAiMessage} disabled={generating} size="icon" className="shrink-0 bg-primary text-white hover:bg-primary/90">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea className="glass-card min-h-[150px] font-bold leading-relaxed text-xs" placeholder="Ou digite sua mensagem aqui..." value={message} onChange={e => setMessage(e.target.value)} />
                </div>

                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => setShowForm(false)}>Abortar</Button>
                   <Button className="flex-1 h-14 rounded-2xl premium-gradient text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={() => setStep("audience")}>Próximo: Audiência</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                 <div className="bento-item space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-11 h-12 glass-card font-bold text-xs" placeholder="Filtrar base por nome ou cidade..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                    </div>
                    <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                      {clientsLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                      ) : filteredClients.map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => {
                          setSelectedClients(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                        }}>
                           <Checkbox checked={selectedClients.includes(c.id)} onCheckedChange={() => {}} />
                           <div className="flex-1">
                             <p className="text-xs font-black uppercase">{c.name}</p>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{c.city || 'Localidade não informada'}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="bento-item border-l-4 border-l-warning space-y-4 bg-warning/5">
                    <h3 className="text-[10px] font-black uppercase text-warning flex items-center gap-2 tracking-widest">
                       <Clock className="h-4 w-4" /> Agendamento Cronometrado
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="date" className="glass-card font-bold text-xs" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                      <Input type="time" className="glass-card font-bold text-xs" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => setStep("builder")}>Voltar</Button>
                    <Button disabled={saving} className="flex-1 h-14 rounded-2xl premium-gradient text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={handleCreate}>
                      {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "DISPARAR / AGENDAR"}
                    </Button>
                 </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bento-item bg-zinc-950 text-white border-zinc-800 shadow-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                 <Smartphone className="h-4 w-4" /> Preview de Saída
               </h3>
               <div className="relative mx-auto w-full max-w-[240px] aspect-[9/18] bg-zinc-900 rounded-[2.5rem] border-[6px] border-zinc-800 p-3 shadow-inner">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-zinc-800 rounded-b-xl" />
                 <div className="h-full bg-zinc-800/20 rounded-[2rem] p-3 overflow-y-auto">
                    {message ? (
                      <div className="bg-primary text-white text-[9px] font-bold p-3 rounded-2xl rounded-tr-none shadow-md animate-in fade-in slide-in-from-bottom-2">
                         {message}
                         <div className="text-[7px] text-white/50 text-right mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest text-center">Aguardando composição...</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>

            <div className="bento-item border-l-4 border-l-success bg-success/5">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-success mb-4">Estimativa de Impacto</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Alcance</span>
                    <span className="text-primary font-black uppercase text-xs">{selectedClients.length} NODES</span>
                 </div>
                 <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Conversão (IA)</span>
                    <span className="text-success font-black text-xs">~{Math.round(selectedClients.length * 0.12)} LEADS</span>
                 </div>
                 <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 font-bold italic leading-relaxed">
                      "Recomendação Core: O canal {platform} apresenta 85% de taxa de abertura para este segmento."
                    </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bento-grid">
          <AnimatePresence>
          {campaigns && campaigns.length > 0 ? campaigns.map(c => {
            const config = statusConfig[c.status] || statusConfig.draft;
            const Icon = config.icon;
            return (
              <motion.div 
                layout 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={c.id} 
                className="bento-item group col-span-12 md:col-span-4 flex flex-col justify-between h-64 hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-sm ${config.color}`}>
                       <Icon className="h-3 w-3" /> {config.label}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if(confirm('Deseja realmente deletar esta orquestração?')) { 
                          deleteMutation.mutate(c.id);
                        } 
                      }} 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive rounded-xl hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-tight mb-1 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                     <Badge variant="outline" className="text-[8px] font-black uppercase border-muted-foreground/30 text-muted-foreground">{c.platform}</Badge>
                     <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{c.target_count} RECEPTORES</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 italic font-medium leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/5">"{c.message}"</p>
                </div>
                <div className="mt-4 pt-4 border-t border-muted/30 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 grayscale opacity-50">
                     <TrendingUp className="h-3 w-3 text-success" />
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Analíticos indisponíveis</span>
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </motion.div>
            );
          }) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-12 py-32 text-center glass-card rounded-[2rem]">
              <div className="h-16 w-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-muted" />
              </div>
              <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Nenhum fluxo de campanha orquestrado no pipeline.</p>
              <Button onClick={() => setShowForm(true)} variant="link" className="mt-4 text-primary font-black uppercase text-[10px]">Iniciar Orquestração</Button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
