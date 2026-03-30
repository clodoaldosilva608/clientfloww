/**
 * src/components/AICopilot.tsx
 * Phase 4 — AI Copilot Component
 *
 * ChatGPT-style copilot integrated into the app.
 * Users can type natural language commands and the AI executes real actions.
 *
 * Features:
 * - Floating button with animated pulse
 * - Slide-in chat panel
 * - Typing indicator with shimmer animation
 * - Action chips for quick commands
 * - Message history with source badges
 * - Real action execution via orchestrator
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAI } from "@/hooks/useAI";
import { processUserMessage, runAutonomousSellCycle, gerarInsightsDashboard } from "@/services/ai.orchestrator";
import { getAIServiceStatus } from "@/services/ai.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BrainCircuit, Send, X, Sparkles, ChevronDown,
  Zap, Users, AlertTriangle, MessageSquare, Target,
  RefreshCw, Bot, User, CheckCircle2, Maximize2, Minimize2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  source?: "ai" | "system" | "fallback";
  action?: string;
  executedAction?: boolean;
}

// ─── Quick Action Chips ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Criar campanha VIP", icon: Zap, message: "Criar campanha para clientes VIP" },
  { label: "Clientes em risco", icon: AlertTriangle, message: "Quais clientes estão em risco de churn?" },
  { label: "Segmentar clientes", icon: Users, message: "Segmentar clientes automaticamente" },
  { label: "Gerar mensagem", icon: MessageSquare, message: "Gerar mensagem promocional persuasiva" },
  { label: "Insights do dashboard", icon: Target, message: "Me mostre os insights do dashboard" },
  { label: "Vender automaticamente", icon: Sparkles, message: "Executar ciclo de vendas autônomo" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function AICopilot() {
  const { organization, user } = useAuth();
  const { churnSignals } = useAI();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const status = getAIServiceStatus();
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `👋 Olá! Sou o **ClientFlow Copilot**, seu assistente de IA.\n\n${
          status.configured 
            ? "🟢 Conectado ao Hugging Face — IA real ativa!" 
            : "🟡 Hugging Face não configurado — usando IA local"
        }\n\nPosso:\n• 📢 Criar campanhas automaticamente\n• 🏷️ Segmentar seus clientes\n• 🚨 Identificar clientes em risco\n• ✍️ Gerar mensagens de marketing\n• 📊 Analisar seu dashboard\n\nDigite sua pergunta ou use os atalhos abaixo!`,
        timestamp: new Date(),
        source: "system",
      }]);
    }
  }, [isOpen, messages.length]);

  // ─── Send Message ───────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !organization?.id || !user?.id) return;

    // Add user message
    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setShowQuickActions(false);
    setIsTyping(true);

    try {
      // Special handler for autonomous selling
      if (messageText.toLowerCase().includes("vender automaticamente") || messageText.toLowerCase().includes("ciclo de vendas")) {
        const result = await runAutonomousSellCycle(organization.id);
        
        const assistantMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: `🤖 **Ciclo de Vendas Autônomo Executado!**\n\n📢 Campanhas criadas: **${result.campaignsCreated}**\n👥 Clientes alvo: **${result.clientsTargeted}**\n\n**Ações executadas:**\n${result.actions.map(a => `• ${a}`).join("\n")}`,
          timestamp: new Date(),
          source: "system",
          action: "autonomous_sell",
          executedAction: true,
        };
        setMessages(prev => [...prev, assistantMsg]);
        toast.success(`Ciclo autônomo concluído! ${result.campaignsCreated} campanhas criadas.`);
      } else {
        // Normal orchestrator processing
        const response = await processUserMessage(messageText, {
          organizationId: organization.id,
          userId: user.id,
          churnSignals,
        });

        const assistantMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          source: response.source,
          action: response.action,
          executedAction: response.executedAction,
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Show toast for executed actions
        if (response.executedAction) {
          toast.success("Ação executada com sucesso!", {
            description: response.action?.replace(/_/g, " "),
          });
        }
      }
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Erro ao processar: ${err.message}\n\nTente novamente ou use um dos atalhos.`,
        timestamp: new Date(),
        source: "system",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl premium-gradient shadow-2xl shadow-primary/30 flex items-center justify-center group"
            id="copilot-toggle"
          >
            <BrainCircuit className="h-6 w-6 text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ping" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/50" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed z-50 ${
              isExpanded
                ? "inset-4 md:inset-8"
                : "bottom-6 right-6 w-[420px] h-[600px] max-h-[85vh]"
            } flex flex-col rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-3xl shadow-2xl shadow-black/40 overflow-hidden`}
            id="copilot-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl premium-gradient flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                    Copilot
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    {isTyping ? "Processando..." : "Pronto"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-white/5"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-3.5 w-3.5 text-zinc-400" /> : <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : ""}`}>
                    {/* Avatar */}
                    <div className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === "user" ? "bg-primary/20" : "premium-gradient"
                      }`}>
                        {msg.role === "user"
                          ? <User className="h-3.5 w-3.5 text-primary" />
                          : <Bot className="h-3.5 w-3.5 text-white" />
                        }
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary/15 border border-primary/20 text-white"
                          : "bg-zinc-900/80 border border-white/5 text-zinc-200"
                      }`}>
                        {/* Content with markdown-like rendering */}
                        <div className="text-[12px] leading-relaxed whitespace-pre-wrap font-medium">
                          {renderMessage(msg.content)}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[8px] text-zinc-600 font-bold">
                            {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.source && msg.role === "assistant" && (
                            <Badge className={`text-[7px] font-black uppercase border-none px-1.5 py-0 ${
                              msg.source === "ai" ? "bg-emerald-500/10 text-emerald-400" :
                              msg.source === "system" ? "bg-blue-500/10 text-blue-400" :
                              "bg-zinc-500/10 text-zinc-400"
                            }`}>
                              {msg.source === "ai" ? "HF AI" : msg.source === "system" ? "SISTEMA" : "LOCAL"}
                            </Badge>
                          )}
                          {msg.executedAction && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="h-7 w-7 rounded-lg premium-gradient flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-zinc-900/80 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                            className="h-1.5 w-1.5 rounded-full bg-primary shadow-primary/50"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        IA processando...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
                  Ações rápidas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.message)}
                      disabled={isTyping}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-primary/30 hover:bg-primary/10 transition-all text-[10px] font-bold text-zinc-400 hover:text-primary disabled:opacity-50"
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5 bg-zinc-900/40">
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-primary/30 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder={isTyping ? "Aguardando resposta..." : "Digite sua pergunta..."}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none font-medium"
                  id="copilot-input"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="h-8 w-8 rounded-xl premium-gradient shadow-lg shadow-primary/20 disabled:opacity-30 disabled:shadow-none"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </Button>
              </div>
              <p className="text-[8px] text-zinc-600 font-bold text-center mt-1.5 uppercase tracking-widest">
                ClientFlow Copilot · IA conectada ao Hugging Face
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Simple Markdown-like Renderer ───────────────────────────────────────────

function renderMessage(content: string): React.ReactNode {
  // Split by lines and render with basic formatting
  const parts = content.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-black text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default AICopilot;
