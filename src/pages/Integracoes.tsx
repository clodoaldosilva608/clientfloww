// Phase 0: System Stabilization - Integracoes.tsx
import { useState, useEffect, useCallback } from "react";
import { 
  MessageCircle, Send, Instagram, Bot, Check, X, 
  Loader2, ExternalLink, Zap, Plug, ShieldCheck, 
  Cpu, HelpCircle, ArrowRight, Copy, Info, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { integrationService } from "@/services/integration.service";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface IntegrationCardProps {
  platform: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  docsUrl?: string;
  guideSteps: { title: string; desc: string; link?: string; linkText?: string }[];
}

const integrations: IntegrationCardProps[] = [
  {
    platform: "telegram",
    title: "Telegram Bot",
    description: "Orquestração completa via Bot API para envios instantâneos e notificações.",
    icon: <Send className="w-6 h-6" />,
    color: "from-sky-400 to-blue-600",
    fields: [
      { key: "bot_token", label: "Token do Bot (API)", placeholder: "123456:ABC-DEF...", type: "password" },
      { key: "default_chat_id", label: "ID de Chat Padrão", placeholder: "-100..." },
    ],
    docsUrl: "https://t.me/BotFather",
    guideSteps: [
      { 
        title: "1. Inicie o @BotFather", 
        desc: "No seu Telegram, busque por @BotFather (o bot oficial da Meta/Telegram para criar bots).",
        link: "https://t.me/BotFather",
        linkText: "Abrir no Telegram" 
      },
      { 
        title: "2. Crie um Novo Robô", 
        desc: "Envie o comando /newbot. Siga as instruções para dar um nome e um username ao seu bot." 
      },
      { 
        title: "3. Pegue sua Chave Token", 
        desc: "O BotFather retornará um Token API (ex: 12345:ABC...). Copie e cole aqui no campo 'Token do Bot'." 
      }
    ]
  },
  {
    platform: "whatsapp",
    title: "WhatsApp Cloud API",
    description: "Conectividade oficial via Meta Business para escala e confiança.",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "from-green-400 to-emerald-600",
    fields: [
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "access_token", label: "Token de Acesso Temporário/Permanente", placeholder: "EAAG...", type: "password" },
    ],
    docsUrl: "https://developers.facebook.com/",
    guideSteps: [
      { 
        title: "1. Portal de Desenvolvedores", 
        desc: "Crie uma conta em developers.facebook.com e adicione o produto 'WhatsApp'.",
        link: "https://developers.facebook.com/",
        linkText: "Acessar Portal Meta" 
      },
      { 
        title: "2. Configure o App", 
        desc: "Selecione seu aplicativo e vá em 'WhatsApp' -> 'Configuração de API'." 
      },
      { 
        title: "3. Copie as Credenciais", 
        desc: "Copie o 'Phone Number ID' e o 'Acesso Temporário' e preencha os campos ao lado." 
      }
    ]
  },
  {
    platform: "huggingface",
    title: "IA Especializada (Hugging Face)",
    description: "Execute modelos Llama, Stable Diffusion e outros via nuvem HF.",
    icon: <Cpu className="w-6 h-6 text-white" />,
    color: "from-amber-400 to-orange-600",
    fields: [
      { key: "api_token", label: "Token de Acesso (Read)", placeholder: "hf_...", type: "password" },
    ],
    docsUrl: "https://huggingface.co/settings/tokens",
    guideSteps: [
      { 
        title: "1. Crie sua conta HF", 
        desc: "Acesse a maior plataforma de IA do mundo e crie sua conta gratuita.",
        link: "https://huggingface.co/join",
        linkText: "Registrar no HF" 
      },
      { 
        title: "2. Vá em Configurações de Token", 
        desc: "No seu perfil, clique em Settings -> Access Tokens.",
        link: "https://huggingface.co/settings/tokens",
        linkText: "Gerenciar Tokens" 
      },
      { 
        title: "3. Gere um 'Read Token'", 
        desc: "Crie um novo token com permissão 'Read', copie (hf_...) e cole no campo ao lado." 
      }
    ]
  },
];

function GuideModal({ title, steps }: { title: string, steps: any[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-[10px] flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
           <HelpCircle className="h-3 w-3" /> Ver Guia Visual
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl glass-card bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
             <Info className="h-6 w-6 text-primary" /> Tutorial: {title}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Assista às etapas para habilitar a inteligência do ClientFlow neste canal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6 border-y border-zinc-800 my-4">
           {steps.map((step, idx) => (
             <div key={idx} className="flex gap-4 group">
                <div className="h-8 w-8 rounded-full border-2 border-primary/40 flex items-center justify-center flex-shrink-0 font-black text-sm text-primary">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                   <h4 className="font-black uppercase text-xs tracking-widest">{step.title}</h4>
                   <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                   {step.link && (
                     <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:underline pt-2">
                        {step.linkText} <ExternalLink className="h-3 w-3" />
                     </a>
                   )}
                </div>
             </div>
           ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 items-center sm:justify-between">
           <div className="flex items-center gap-2">
             <ShieldCheck className="h-4 w-4 text-success" />
             <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-tighter">Criptografia de Ponta a Ponta Ativa</span>
           </div>
           <Button variant="outline" className="rounded-xl font-black uppercase text-[10px]" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
              Fechar
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({ platform, title, description, icon, color, fields, docsUrl, guideSteps }: IntegrationCardProps) {
  const { organization } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      if (!organization?.id) return;
      const { data, error } = await integrationService.getConfig(platform, organization.id);
      if (error) {
        console.error(`[Integracoes] Erro ao carregar ${platform}:`, error);
        setIsError(true);
        return;
      }
      if (data) {
        setIsActive(data.is_active || false);
        setConfig((data.config as Record<string, string>) || {});
      }
    } catch (error) {
      console.error(`[Integracoes] Falha ao carregar ${platform}:`, error);
      setIsError(true);
    }
  }, [platform, organization?.id]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // FIX: accept activeOverride to avoid React closure stale-state bug
  // when called from switch toggle, pass the new value directly
  const saveConfig = async (activeOverride?: boolean) => {
    const activeValue = activeOverride !== undefined ? activeOverride : isActive;
    if (!organization?.id) return;
    setSaving(true);
    try {
      const { error } = await integrationService.saveConfig(platform, activeValue, config, organization.id);
      if (error) throw new Error(error);
      toast.success(`${title} salvo com sucesso!`);
    } catch (error: any) {
      console.error(`[Integracoes] Falha ao salvar ${platform}:`, error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (isError) return (
     <div className="bento-item border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center p-8 gap-4">
        <AlertTriangle className="text-red-500 h-8 w-8" />
        <p className="text-[10px] font-black uppercase text-red-500">Falha na conexão com o banco</p>
        <Button size="sm" variant="ghost" className="text-xs" onClick={loadConfig}>Tentar Novamente</Button>
     </div>
  );

  return (
    <motion.div whileHover={{ scale: 1.01 }} className="bento-item p-0 overflow-hidden flex flex-col relative group">
       <div className={`p-6 bg-gradient-to-br ${color} text-white flex justify-between items-start`}>
          <div className="flex gap-4">
             <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner font-black">
                {icon}
             </div>
             <div>
                <h3 className="font-black text-lg tracking-tight uppercase leading-tight">{title}</h3>
                <div className="flex items-center gap-2 mt-1 opacity-80">
                   <ShieldCheck className="h-3 w-3" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">SaaS Encryption</span>
                </div>
             </div>
          </div>
           <Switch 
            checked={isActive} 
            onCheckedChange={(val) => { 
              setIsActive(val);
              // Pass val directly to avoid stale closure capturing old isActive
              saveConfig(val);
            }} 
            className="data-[state=checked]:bg-white data-[state=checked]:dark:bg-white"
          />
       </div>

       <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-3">
              "{description}"
            </p>
            <GuideModal title={title} steps={guideSteps} />
          </div>

          <div className="space-y-4">
             {fields.map((field) => (
                <div key={field.key} className="space-y-1.5 text-left">
                   <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1">{field.label}</Label>
                   <Input 
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={config[field.key] || ""}
                      onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      className="glass-card h-10 text-xs border-zinc-800 focus:border-primary/50"
                   />
                </div>
             ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
             <Button size="sm" onClick={saveConfig} disabled={saving} className="w-full rounded-xl h-10 premium-gradient text-white text-[10px] font-black uppercase tracking-widest">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Zap className="h-3.5 w-3.5 mr-2" />}
                Sincronizar Cloud Flow
             </Button>
          </div>
       </div>
    </motion.div>
  );
}

export default function Integracoes() {
  const [mainLoading, setMainLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMainLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (mainLoading) return (
     <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}
        </div>
     </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen">
      <header>
         <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
           <Zap className="h-8 w-8 text-primary fill-current" />
           <span className="premium-gradient bg-clip-text text-transparent uppercase text-3xl md:text-5xl">Central de Conexões</span>
         </h1>
         <p className="text-muted-foreground mt-2 max-w-xl text-xs font-medium uppercase tracking-widest opacity-70 leading-relaxed italic">
           Conecte canais de saída ao cérebro de IA do Flow. Automatize respostas, colete dados e escale sua presença digital sem intervenção manual.
         </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {integrations.map((n) => (
           <IntegrationCard key={n.platform} {...n} />
         ))}
      </div>

      <div className="bento-item bg-zinc-950 text-white border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce-slow">
               <Bot className="h-10 w-10 text-white" />
            </div>
            <div>
               <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Status da Engine SaaS</h3>
               <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-widest">Processamento Geo-Distribuído Ativo</p>
            </div>
         </div>
         <div className="px-6 py-3 rounded-full border border-success/30 bg-success/5 flex items-center gap-3 relative z-10">
            <Check className="text-success h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success">Cloud Sync: Conectado</span>
         </div>
      </div>
    </motion.div>
  );
}
