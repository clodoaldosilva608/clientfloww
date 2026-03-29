import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { trackEvent, identifyUser } from "@/lib/tracking";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode) || "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
    } else {
      identifyUser(data.user.id, { email });
      trackEvent("conversion", { flow: "login" });
      toast.success("Login realizado com sucesso!");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      if (data.user) identifyUser(data.user.id, { email, name: fullName });
      trackEvent("signup", { method: "email" });
      trackEvent("conversion", { flow: "signup_success" });
      toast.success("Conta criada! Verifique seu email para confirmar.");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="p-4 relative z-10">
        <Link to="/landing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl text-foreground tracking-tight">ClientFlow</span>
          </div>

          <div className="glass-card-solid p-6 sm:p-8">
            <h1 className="text-xl font-heading font-bold text-card-foreground text-center mb-1">
              {mode === "login" && "Bem-vindo de volta"}
              {mode === "signup" && "Criar sua conta"}
              {mode === "forgot" && "Recuperar senha"}
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {mode === "login" && "Entre para acessar sua conta"}
              {mode === "signup" && "Comece a usar o ClientFlow gratuitamente"}
              {mode === "forgot" && "Enviaremos um link de recuperação"}
            </p>

            <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="Seu nome" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 glow-accent">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === "login" && "Entrar"}
                {mode === "signup" && "Criar conta"}
                {mode === "forgot" && "Enviar link de recuperação"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" && (
                <>Não tem conta?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Criar conta</button>
                </>
              )}
              {mode === "signup" && (
                <>Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Entrar</button>
                </>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Voltar ao login</button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
