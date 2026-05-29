import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ExternalLink, ShieldCheck, Zap, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { integrationService } from "@/services/integration.service";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function OnboardingModal() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      if (!organization?.id) return;
      
      try {
        const { data } = await integrationService.getConfig("gemini", organization.id);
        
        // Se não tem configuração ou a chave está vazia, abre o modal
        if (!data || !data.config?.api_key) {
          // Pequeno delay para não assustar no primeiro render
          setTimeout(() => setIsOpen(true), 1500);
        }
      } catch (e) {
        console.error("Erro ao verificar status do onboarding:", e);
      } finally {
        setLoading(false);
      }
    }
    
    checkStatus();
  }, [organization?.id]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira a chave de API.");
      return;
    }

    if (!organization?.id) return;

    setSaving(true);
    try {
      const { error } = await integrationService.saveConfig("gemini", true, { api_key: apiKey }, organization.id);
      if (error) throw new Error(error);
      
      toast.success("IA configurada com sucesso! Seu assistente está pronto.");
      setIsOpen(false);
      
      // Se estivermos no dashboard, recarrega para o AI Assistant aparecer
      if (window.location.pathname === "/") {
        window.location.reload();
      }
    } catch (e: any) {
      toast.error("Erro ao salvar configuração: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    toast.info("Você pode configurar a IA depois na página de Integrações.", {
      action: {
        label: "Configurar",
        onClick: () => navigate("/integracoes")
      }
    });
  };

  if (loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md glass-card bg-zinc-950 border-zinc-800 text-white" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight">Ative sua Inteligência</DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-xs px-2">
            O ClientFlow fica 10x mais poderoso com a IA ativada. Conecte sua conta do Google Gemini para gerar campanhas e respostas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex gap-4 group bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-xs text-primary">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-300">Acesse o AI Studio</h4>
                <p className="text-[10px] text-zinc-500">Entre com sua conta Google e clique em "Create API Key".</p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:text-primary/80 pt-1">
                  Abrir Google AI Studio <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 pl-1">
                Sua Chave de API
              </Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="glass-card h-11 text-xs border-zinc-800 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" onClick={handleSkip} className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">
            Pular (Lembrar depois)
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest glow-primary h-10">
            {saving ? "Salvando..." : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Ativar IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
