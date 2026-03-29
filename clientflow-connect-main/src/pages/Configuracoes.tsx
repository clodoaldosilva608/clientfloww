import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Palette, User, Save, Loader2, Settings, Shield, Zap, Bell, Monitor, LogOut } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await authService.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { data: { user } } = await authService.getUser();
      if (!user) { toast.error("Faça login"); return; }

      setSaving(true);
      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      if (error) throw error;
      toast.success("Perfil atualizado!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/landing");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Zap className="h-10 w-10 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      <header>
         <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
           <Settings className="h-8 w-8 text-primary fill-current" />
           <span className="premium-gradient bg-clip-text text-transparent uppercase">Preferências do Sistema</span>
         </h1>
         <p className="text-muted-foreground mt-1">Gerencie sua identidade e o comportamento da plataforma.</p>
      </header>

      <div className="bento-grid">
        {/* Profile Section */}
        <div className="bento-item col-span-12 lg:col-span-8 space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                 <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Identidade ClientFlow</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                 <Input 
                   value={fullName} 
                   onChange={e => setFullName(e.target.value)} 
                   placeholder="Seu nome" 
                   className="glass-card h-12"
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone de Contato</Label>
                 <Input 
                   value={phone} 
                   onChange={e => setPhone(e.target.value)} 
                   placeholder="(00) 00000-0000" 
                   className="glass-card h-12"
                 />
              </div>
           </div>

           <div className="pt-4 border-t flex justify-end">
              <Button onClick={saveProfile} disabled={saving} className="rounded-xl h-12 px-8 premium-gradient text-white font-black uppercase text-xs">
                 {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                 Persistir Alterações
              </Button>
           </div>
        </div>

        {/* Preferences Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bento-item space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-xl">
                    <Monitor className="h-5 w-5 text-accent" />
                 </div>
                 <h2 className="text-sm font-bold uppercase tracking-tight text-accent">Interface & Tema</h2>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Aparência Global</span>
                    <Badge variant="outline" className="text-[9px] font-black">SISTEMA</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Idioma Principal</span>
                    <Badge variant="outline" className="text-[9px] font-black">PT-BR</Badge>
                 </div>
              </div>
           </div>

           <div className="bento-item border-l-4 border-l-success space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-success/10 rounded-xl">
                    <Shield className="h-5 w-5 text-success" />
                 </div>
                 <h2 className="text-sm font-bold uppercase tracking-tight text-success">Segurança RLS</h2>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                 "Sua conta está protegida por Row Level Security nativo do Supabase. Todos os dados são criptografados."
              </p>
           </div>
        </div>

        {/* Logout Section */}
        <div className="bento-item col-span-12 md:col-span-6 bg-destructive/5 border-destructive/20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/10 rounded-xl">
                 <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <div>
                 <h3 className="font-bold text-sm uppercase text-destructive">Encerrar Sessão</h3>
                 <p className="text-[10px] text-muted-foreground">Você será redirecionado com segurança.</p>
              </div>
           </div>
           <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 uppercase text-[10px] font-black">
              Sair Agora
           </Button>
        </div>

        {/* Additional Settings (Mocked) */}
        <div className="bento-item col-span-12 md:col-span-6 bg-zinc-950 text-white border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                 <h3 className="font-bold text-sm uppercase">Notificações Push</h3>
                 <p className="text-[10px] text-zinc-500">Alertas de campanhas entregues</p>
              </div>
           </div>
           <div className="h-6 w-11 bg-zinc-800 rounded-full relative p-1 cursor-pointer">
              <div className="h-4 w-4 bg-white rounded-full transition-transform translate-x-5" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
