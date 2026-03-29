import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, MessageSquare, Phone, Mail, MapPin, 
  Calendar, Zap, BrainCircuit, History, 
  TrendingUp, MessageCircle, Instagram, Send,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface CRM360ViewProps {
  client: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CRM360View({ client, isOpen, onClose }: CRM360ViewProps) {
  if (!client) return null;

  // Mock engagement score
  const engagementScore = Math.floor(Math.random() * 40) + 60; // 60-100

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto glass-card border-l border-zinc-200/50 dark:border-zinc-800/50">
        <SheetHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl premium-gradient flex items-center justify-center text-xl font-black text-white shadow-xl shadow-primary/20">
              {client.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <SheetTitle className="text-2xl font-black tracking-tight">{client.name}</SheetTitle>
              <div className="flex gap-2 mt-1">
                {client.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[9px] uppercase font-bold tracking-widest bg-zinc-100 dark:bg-zinc-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* AI Insight Header */}
          <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="h-20 w-20" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Perfil ClientFlow IA</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{engagementScore}%</span>
                <span className="text-xs text-success font-bold flex items-center gap-1">
                   <TrendingUp className="h-3 w-3" /> Score de Engajamento
                </span>
              </div>
              <p className="text-[11px] mt-4 text-zinc-400 leading-relaxed italic">
                "Este cliente possui alta afinidade com campanhas de WhatsApp enviadas às terças-feiras. Recomenda-se oferta personalizada de vitaminas baseada no histórico de 30 dias."
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start gap-4 h-auto p-0 bg-transparent border-b border-zinc-100 dark:border-zinc-800 rounded-none mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 font-bold px-0">Visão 360°</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 font-bold px-0">Jornada</TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 font-bold px-0">Dados Brutos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Último Contato</span>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Calendar className="h-4 w-4 text-primary" />
                    Há 2 dias
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Plataforma Preferida</span>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <MessageCircle className="h-4 w-4 text-success" />
                    WhatsApp
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Canais de Ação</h4>
                <div className="grid grid-cols-2 gap-3">
                   <Button className="rounded-xl h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold gap-2">
                     <MessageCircle className="h-5 w-5" /> WhatsApp
                   </Button>
                   <Button className="rounded-xl h-12 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-bold gap-2">
                     <Send className="h-5 w-5" /> Telegram
                   </Button>
                   <Button variant="outline" className="rounded-xl h-12 font-bold gap-2 col-span-2">
                     <Instagram className="h-5 w-5 text-pink-600" /> Ver no Instagram
                   </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Localização</h4>
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm font-bold">{client.street}, {client.house_number}</p>
                    <p className="text-xs text-muted-foreground">{client.neighborhood} • {client.city}, {client.state}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
               <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-8">
                  <div className="relative">
                    <div className="absolute left-[-1.9rem] top-1 h-6 w-6 rounded-full bg-success flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-sm">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Mensagem Entregue</p>
                      <p className="text-[11px] text-muted-foreground">Campanha "Promoção Verão" via WhatsApp</p>
                      <p className="text-[10px] mt-1 text-primary font-bold uppercase tracking-tighter">Ontem às 14:20</p>
                    </div>
                  </div>

                  <div className="relative opacity-60">
                    <div className="absolute left-[-1.9rem] top-1 h-6 w-6 rounded-full bg-zinc-400 flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-sm">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Cadastrado no Sistema</p>
                      <p className="text-[11px] text-muted-foreground">Importado via CRM Principal</p>
                      <p className="text-[10px] mt-1 text-muted-foreground font-bold uppercase tracking-tighter">Há 15 dias</p>
                    </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="data">
               <div className="bg-muted/30 p-4 rounded-xl font-mono text-[10px] whitespace-pre-wrap overflow-x-auto border">
                  {JSON.stringify(client, null, 2)}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
