import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserPlus, Megaphone, CalendarClock,
  History, Settings, ChevronLeft, ChevronRight, Zap, Plug, LogOut, Activity, CreditCard, BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { CommandMenu } from "./CommandMenu";
import { useTranslation } from "@/i18n/useTranslation";


export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { path: "/clientes", label: t("nav.clients", "Clientes"), icon: Users },
    { path: "/clientes/novo", label: t("nav.newClient", "Novo Cliente"), icon: UserPlus },
    { path: "/campanhas", label: t("nav.campaigns", "Campanhas"), icon: Megaphone },
    { path: "/agendamentos", label: t("nav.scheduling", "Agendamentos"), icon: CalendarClock },
    { path: "/historico", label: t("nav.history", "Histórico"), icon: History },
    { path: "/automacoes/builder", label: t("nav.workflow", "Workflow Builder"), icon: Zap },
    { path: "/integracoes", label: t("nav.integrations", "Integrações"), icon: Plug },
    { path: "/billing", label: t("nav.billing", "Planos & Billing"), icon: CreditCard },
    { path: "/ai", label: t("nav.nexusAi", "Nexus AI"), icon: BrainCircuit },
    { path: "/admin/monitor", label: t("nav.monitor", "Monitor Engine"), icon: Activity },
    { path: "/configuracoes", label: t("nav.settings", "Configurações"), icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/landing");
  };

  return (
    <aside
      className={cn(
        "flex flex-col glass-sidebar transition-all duration-500 ease-in-out h-screen sticky top-0 z-40 overflow-hidden",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-sidebar-border/30">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="flex items-center justify-center w-10 h-10 rounded-xl premium-gradient shadow-lg shadow-primary/20"
        >
          <Zap className="w-5 h-5 text-white fill-current" />
        </motion.div>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-heading font-black text-xl text-foreground tracking-tighter"
          >
            ClientFlow<span className="text-primary">.</span>
          </motion.span>
        )}
      </div>

      {/* Command Menu was moved to AppLayout to avoid z-index and overflow clipping issues */}

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:translate-x-1"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-[-1rem] w-1.5 h-6 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section (Quick Preview) */}
      {!collapsed && (
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800">
           <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-black">CF</div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-white truncate">Usuário Flow</p>
                <p className="text-[9px] text-zinc-500 truncate">SaaS Enterprise</p>
              </div>
           </div>
           <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3" />
           </div>
           <p className="text-[8px] mt-2 text-zinc-500 font-bold uppercase tracking-widest text-center">65% das mensagens usadas</p>
        </div>
      )}

      {/* Logout */}
      <div className="px-4 pb-4">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 w-full",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:translate-x-1"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t("nav.logout", "Encerrar Sessão")}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-16 border-t border-sidebar-border/30 text-muted-foreground hover:text-foreground transition-all duration-300"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><ChevronLeft className="w-4 h-4" /> {t("nav.collapse", "Recolher Sidebar")}</div>}
      </button>
    </aside>
  );
}
