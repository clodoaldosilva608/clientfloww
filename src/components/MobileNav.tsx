import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Megaphone, CalendarClock, Menu,
  UserPlus, History, Settings, Zap, Plug, LogOut, Activity,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const bottomNavItems = [
  { path: "/", label: "Início", icon: LayoutDashboard },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/campanhas", label: "Campanhas", icon: Megaphone },
  { path: "/agendamentos", label: "Agenda", icon: CalendarClock },
];

const allNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/clientes/novo", label: "Novo Cliente", icon: UserPlus },
  { path: "/campanhas", label: "Campanhas", icon: Megaphone },
  { path: "/agendamentos", label: "Agendamentos", icon: CalendarClock },
  { path: "/historico", label: "Histórico", icon: History },
  { path: "/automacoes/builder", label: "Workflow Builder", icon: Zap },
  { path: "/integracoes", label: "Integrações", icon: Plug },
  { path: "/admin/monitor", label: "Monitor Engine", icon: Activity },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = async () => {
    setSheetOpen(false);
    await signOut();
    navigate("/landing");
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/5 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-black uppercase tracking-tighter transition-all",
                  isActive ? "text-primary scale-110" : "text-zinc-500"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-black uppercase tracking-tighter text-zinc-500">
                <Menu className="w-5 h-5" />
                <span>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] bg-black border-zinc-800 p-0 overflow-hidden flex flex-col">
              <SheetHeader className="px-6 h-20 flex flex-row items-center gap-3 border-b border-zinc-800/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl premium-gradient shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <SheetTitle className="font-heading font-black text-xl text-foreground tracking-tighter">
                  ClientFlow<span className="text-primary">.</span>
                </SheetTitle>
              </SheetHeader>
              
              <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                {allNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-zinc-900 bg-zinc-950/20 space-y-4">
                {/* User Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white">CF</div>
                    <div className="overflow-hidden text-left">
                      <p className="text-[11px] font-bold text-white truncate">Usuário Flow</p>
                      <p className="text-[9px] text-zinc-500 truncate uppercase tracking-widest">SaaS Enterprise</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3" />
                  </div>
                  <p className="text-[8px] mt-2 text-zinc-500 font-black uppercase tracking-[0.2em] text-center">65% das mensagens usadas</p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Encerrar Sessão</span>
                </button>

                {/* Close/Recolher placeholder */}
                <button
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
                >
                  <ChevronLeft className="w-4 h-4" /> Recolher Menu
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </>
  );
}
