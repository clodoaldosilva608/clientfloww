import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Zap, MapPin, Loader2, ArrowLeft, UserPlus, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

const suggestedTags = [
  "fidelizado",
  "novo",
  "VIP",
  "black Friday",
  "alto valor",
  "farmácia",
];

export default function NovoCliente() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { canUse, isLoading: subLoading } = useSubscription();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", phone: "", whatsapp_id: "", email: "", city: "",
    telegram_chat_id: "", instagram_id: "",
    cep: "", street: "", house_number: "", neighborhood: "",
    state: "", complement: "", cpf: "", birth_date: "", notes: "",
  });

  const updateField = (key: string, value: string) => setForm({ ...form, [key]: value });

  // Intelligent CEP Lookup
  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      handleCepLookup(cep);
    }
  }, [form.cep]);

  const handleCepLookup = async (cep: string) => {
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
        toast.info("Endereço preenchido automaticamente");
      }
    } catch (e) {
      console.error("Erro ao buscar CEP", e);
    } finally {
      setFetchingCep(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canUse("clients")) {
      return toast.error("Limite de clientes atingido!", {
        description: "Faça upgrade do seu plano para cadastrar mais clientes.",
        action: {
          label: "Upgrade",
          onClick: () => navigate("/billing")
        }
      });
    }
    if (!form.name.trim()) return toast.error("O nome é obrigatório");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sessão expirada.");

    setSaving(true);
    
    // Using singular insert to avoid conflict between HEAD/Incoming that were using different formats
    const { data: client, error } = await supabase.from("clients").insert({
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone || null,
      whatsapp_id: form.whatsapp_id || null,
      email: form.email || null,
      city: form.city || null,
      telegram_chat_id: form.telegram_chat_id || null,
      instagram_id: form.instagram_id || null,
      notes: form.notes || null,
      cep: form.cep || null,
      street: form.street || null,
      house_number: form.house_number || null,
      neighborhood: form.neighborhood || null,
      state: form.state || null,
      complement: form.complement || null,
      cpf: form.cpf || null,
      birth_date: form.birth_date || null,
    }).select().single();

    if (error || !client) {
      toast.error("Erro ao cadastrar: " + (error?.message || ""));
      setSaving(false);
      return;
    }

    if (tags.length > 0) {
      await supabase.from("client_tags").insert(
        tags.map(tag => ({ client_id: client.id, tag, user_id: user.id }))
      );
    }

    toast.success("Cliente ClientFlow cadastrado com sucesso!", {
      description: "Você pode continuar cadastrando novos clientes.",
    });
    
    // FASE 5: Invalidate queries to update Dashboard and list
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    
    // Reset form and focus
    setForm({
      name: "", phone: "", whatsapp_id: "", email: "", city: "",
      telegram_chat_id: "", instagram_id: "",
      cep: "", street: "", house_number: "", neighborhood: "",
      state: "", complement: "", cpf: "", birth_date: "", notes: "",
    });
    setTags([]);
    setSaving(false);
    
    // Refocus name input for fast data entry
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")} className="rounded-full">
           <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
           <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
             <UserPlus className="text-primary h-7 w-7" />
             <span className="premium-gradient bg-clip-text text-transparent uppercase">Novo Cliente</span>
           </h1>
           <p className="text-muted-foreground text-sm">Adicione inteligência e contexto à sua base de contatos.</p>
        </div>
      </header>

      {!canUse("clients") && !subLoading && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-red-500">Limite Atingido</AlertTitle>
            <AlertDescription className="text-xs font-bold text-zinc-400">
              Você atingiu o limite de clientes do seu plano atual. 
              <button type="button" onClick={() => navigate("/billing")} className="text-primary ml-1 underline">Aumentar limite agora</button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pessoal & Sociais */}
        <section className="space-y-6">
          <div className="bento-item border-l-4 border-l-primary space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-primary">
               <Zap className="h-4 w-4 fill-current" />
               Informações Essenciais
             </h2>
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo *</Label>
                 <Input ref={nameInputRef} className="glass-card" placeholder="Ex: Arthur Morgan" value={form.name} onChange={e => updateField("name", e.target.value)} required />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">WhatsApp</Label>
                    <Input className="glass-card" placeholder="(00) 00000-0000" value={form.whatsapp_id} onChange={e => updateField("whatsapp_id", e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Instagram</Label>
                    <Input className="glass-card" placeholder="@username" value={form.instagram_id} onChange={e => updateField("instagram_id", e.target.value)} />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Corporativo</Label>
                 <Input className="glass-card" type="email" placeholder="contato@empresa.com" value={form.email} onChange={e => updateField("email", e.target.value)} />
               </div>
             </div>
          </div>

          <div className="bento-item border-l-4 border-l-accent space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-accent">
               <Plus className="h-4 w-4" />
               Segmentação & Tags
             </h2>
             <div className="flex flex-wrap gap-2">
                {suggestedTags.filter(t => !tags.includes(t)).map(t => (
                  <button key={t} type="button" onClick={() => addTag(t)} className="text-[9px] uppercase font-black px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent hover:bg-accent hover:text-white transition-all">
                    + {t}
                  </button>
                ))}
             </div>
             <div className="flex gap-2 pt-2">
                <Input className="glass-card text-xs" placeholder="Nova tag personalizada..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} />
                <Button type="button" variant="outline" className="font-black text-xs" onClick={() => addTag(tagInput)}>ADD</Button>
             </div>
             <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {tags.map(t => (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={t}>
                       <Badge className="bg-primary hover:bg-primary text-white gap-1 pl-3 pr-1 py-1 text-[10px] font-black uppercase">
                          {t} <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(t)} />
                       </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
          </div>
        </section>

        {/* Endereço & Notas */}
        <section className="space-y-6">
          <div className="bento-item border-l-4 border-l-success space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-success">
               <MapPin className="h-4 w-4" />
               Geo-Localização
             </h2>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-2 col-span-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">CEP</Label>
                  <div className="relative">
                    <Input className="glass-card" placeholder="00000-000" value={form.cep} onChange={e => updateField("cep", e.target.value)} />
                    {fetchingCep && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
               </div>
               <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Cidade</Label>
                  <Input className="glass-card" placeholder="Cidade" value={form.city} onChange={e => updateField("city", e.target.value)} />
               </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Logradouro</Label>
                <Input className="glass-card" placeholder="Rua, Avenida, Logradouro..." value={form.street} onChange={e => updateField("street", e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bairro</Label>
                  <Input className="glass-card" placeholder="Bairro" value={form.neighborhood} onChange={e => updateField("neighborhood", e.target.value)} />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Número</Label>
                  <Input className="glass-card" placeholder="Ex: 123" value={form.house_number} onChange={e => updateField("house_number", e.target.value)} />
               </div>
             </div>
          </div>

          <div className="bento-item border-l-4 border-l-info space-y-4 bg-info/5">
             <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-info">
               <BrainCircuit className="h-4 w-4" />
               Cognição & Notas Contextuais
             </h2>
             <Textarea className="glass-card min-h-[120px] resize-none text-xs" placeholder="Adicione notas contextuais que a IA poderá usar para personalizar campanhas e comunicações..." value={form.notes} onChange={e => updateField("notes", e.target.value)} />
          </div>

          <div className="flex gap-4 pt-4">
             <Button type="button" variant="ghost" onClick={() => navigate("/clientes")} className="flex-1 rounded-xl py-6 font-black uppercase text-xs tracking-widest">Descartar</Button>
             <Button type="submit" disabled={saving} className="flex-1 rounded-xl py-6 premium-gradient text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Persistir Cadastro"}
             </Button>
          </div>
        </section>

      </form>
    </motion.div>
  );
}
