import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate everything to refresh limits
    queryClient.invalidateQueries();
  }, [queryClient]);

  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6"
      >
        <div className="h-20 w-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight">Assinatura Confirmada!</h1>
          <p className="text-sm text-zinc-400 font-medium">
            Seu plano Premium foi ativado. Os limites da sua conta foram expandidos e todas as funcionalidades estão liberadas.
          </p>
        </div>

        {sessionId && <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest break-all bg-zinc-900/50 p-2 rounded-lg">ID: {sessionId}</p>}

        <Button 
          onClick={() => navigate("/")}
          className="w-full premium-gradient h-14 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20"
        >
          Acessar Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
