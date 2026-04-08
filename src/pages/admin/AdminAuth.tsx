import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha todos os campos");

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Acesso Negado: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // AdminRoute will double check the role, but here we just route them.
      toast.success("Autenticado com sucesso");
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Discreet background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white">Central de Comando</h1>
          <p className="text-xs text-zinc-500 font-bold tracking-widest mt-2 uppercase">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-zinc-950/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Credencial Administrativa</Label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-black/50 border-white/5 rounded-xl text-white font-bold"
              placeholder="admin@clientflow.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Chave de Acesso</Label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-black/50 border-white/5 rounded-xl text-white font-bold tracking-[0.5em]"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <span className="flex items-center gap-2">Autenticar <ArrowRight className="h-4 w-4" /></span>
            )}
          </Button>

          <button 
             type="button" 
             onClick={() => navigate("/")}
             className="w-full mt-4 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
          >
             Retornar ao Portal Público
          </button>
        </form>
      </motion.div>
    </div>
  );
}
