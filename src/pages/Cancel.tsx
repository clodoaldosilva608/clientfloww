import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6"
      >
        <div className="h-20 w-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight">Pagamento Cancelado</h1>
          <p className="text-sm text-zinc-400 font-medium">
            O processo de checkout foi cancelado ou não concluído. Nenhuma cobrança foi realizada no seu cartão.
          </p>
        </div>

        <Button 
          variant="outline"
          onClick={() => navigate("/billing")}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-zinc-900 border border-white/10 hover:bg-zinc-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Planos
        </Button>
      </motion.div>
    </div>
  );
}
