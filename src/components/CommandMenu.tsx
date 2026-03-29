import * as React from "react";
import {
  Settings, Users, Search, LayoutDashboard, Megaphone,
  History, Plug, Zap, UserPlus, CalendarClock, Activity,
  BrainCircuit, Target, FileText, Star, Smile, CreditCard, Crown,
  TrendingUp, AlertTriangle, Brain
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

interface AICommand {
  label: string;
  icon: any;
  action: (navigate: NavigateFunction) => void;
  keywords: string;
  shortcut?: string;
}

const routes = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "início home painel analytics" },
  { path: "/clientes", label: "Clientes", icon: Users, keywords: "lista contatos crm" },
  { path: "/clientes/novo", label: "Novo Cliente", icon: UserPlus, keywords: "cadastrar adicionar" },
  { path: "/campanhas", label: "Campanhas", icon: Megaphone, keywords: "promoção envio mensagem" },
  { path: "/agendamentos", label: "Agendamentos", icon: CalendarClock, keywords: "agenda programar" },
  { path: "/historico", label: "Histórico", icon: History, keywords: "log registro" },
  { path: "/integracoes", label: "Integrações", icon: Plug, keywords: "whatsapp telegram instagram api" },
  { path: "/billing", label: "Planos & Billing", icon: CreditCard, keywords: "preço assinatura upgrade stripe pagamento" },
  { path: "/ai", label: "Nexus AI — Analytics", icon: BrainCircuit, keywords: "ia inteligência score churn insights recommend analytics" },
  { path: "/admin/monitor", label: "Monitor Engine", icon: Activity, keywords: "console operações workers logs" },
  { path: "/configuracoes", label: "Configurações", icon: Settings, keywords: "perfil tema idioma" },
];

const aiCommands: AICommand[] = [
  {
    label: "Criar campanha para clientes VIP",
    icon: Star,
    action: (navigate: any) => {
      navigate("/campanhas?new=true&segment=vip");
    },
    keywords: "campanha vip criar",
    shortcut: "VIP"
  },
  {
    label: "Ver relatório de ontem",
    icon: FileText,
    action: (navigate: any) => {
      navigate("/historico?range=yesterday");
    },
    keywords: "relatório ontem dados",
    shortcut: "REP"
  },
  {
    label: "Gerar Script de Campanha com IA",
    icon: Zap,
    action: (_navigate) => {
      toast.info("Abrindo assistente de IA...");
    },
    keywords: "ia script gerador",
    shortcut: "IA"
  },
  {
    label: "Analisar Sentimento da Base",
    icon: Smile,
    action: (_navigate) => {
      toast.info("Iniciando análise de sentimento...");
    },
    keywords: "sentimento análise humor"
  },
  {
    label: "Verificar status dos workers",
    icon: Activity,
    action: (navigate: any) => {
      navigate("/admin/monitor");
    },
    keywords: "status workers engine monitor"
  },
  {
    label: "Upgrade de Plano / Faturamento",
    icon: Crown,
    action: (navigate: any) => {
      navigate("/billing");
    },
    keywords: "plano preço assinar upgrade"
  },
  // Phase 7 AI Commands
  {
    label: "Detectar clientes em risco de churn",
    icon: AlertTriangle,
    action: (navigate: any) => {
      navigate("/clientes");
      setTimeout(() => {
        toast.info("Filtro: clientes inativos há mais de 15 dias", { description: "Verifique os cards com badge 'Churn Risk'" });
      }, 500);
    },
    keywords: "churn risco inativo detectar perda clientes"
  },
  {
    label: "Criar campanha para clientes inativos",
    icon: Zap,
    action: (navigate: any) => {
      navigate("/campanhas", { state: { autoStart: true, prompt: "Campanha de reativação para clientes inativos: Sentimos sua falta! Temos uma oferta especial esperando por você." } });
    },
    keywords: "campanha inativo reativação criar disparar"
  },
  {
    label: "Analisar melhor horário de envio",
    icon: TrendingUp,
    action: (navigate: any) => {
      navigate("/");
      setTimeout(() => {
        toast.success("⏰ IA análisando janelas de envio do seu histórico...", { description: "Veja o painel Nexus AI no Dashboard" });
      }, 300);
    },
    keywords: "horário melhor envio otimizar IA análise"
  },
  {
    label: "Ver score de engajamento da base",
    icon: Brain,
    action: (navigate: any) => {
      navigate("/clientes");
      setTimeout(() => {
        toast.info("🧠 Scores calculados em tempo real para cada cliente", { description: "VIP > 80 | Quente > 55 | Morno > 30 | Frio < 30" });
      }, 500);
    },
    keywords: "score engajamento vip quente frio base clientes"
  }
];

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground glass-card rounded-xl border border-border/50 hover:text-foreground hover:bg-muted/50 transition-all duration-300 w-full"
      >
        <Search className="h-3 w-3" />
        <span className="flex-1 text-left">Busca inteligente...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="O que você precisa fazer? Ex: 'Criar campanha para VIP'" />
        <CommandList className="border-none">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Navegação Rápida">
            {routes.map((route) => (
              <CommandItem
                key={route.path}
                value={`${route.label} ${route.keywords}`}
                onSelect={() => runCommand(route.path)}
                className="gap-3 cursor-pointer py-3"
              >
                <route.icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-xs uppercase tracking-tight">{route.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="IA & Comandos Globais">
            {aiCommands.map((cmd, i) => (
              <CommandItem
                key={i}
                value={`${cmd.label} ${cmd.keywords}`}
                onSelect={() => {
                  setOpen(false);
                  cmd.action(navigate);
                }}
                className="gap-3 cursor-pointer py-3"
              >
                <cmd.icon className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs uppercase tracking-tight">{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Sistema">
            <CommandItem onSelect={() => runCommand("/configuracoes")} className="py-3 gap-3">
              <Settings className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-tight">Preferências do Sistema</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
