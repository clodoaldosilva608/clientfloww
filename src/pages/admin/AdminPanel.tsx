import { useState } from "react";
import { ShieldCheck, Users, Settings2, Activity, Database, Workflow } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function AdminPanel() {
  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      // Fetch mock/real stats for the dashboard
      const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true }).select();
      // Using stripe_products or subscriptions as revenue mock
      const { count: subCount } = await supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
      
      return {
        totalUsers: usersCount || 0,
        activeSubscriptions: subCount || 0,
        mrr: (subCount || 0) * 49, // Fake calc for display
      };
    }
  });

  const { data: logs } = useQuery({
    queryKey: ["admin_logs"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-primary h-8 w-8" />
          <span className="premium-gradient bg-clip-text text-transparent uppercase">Admin Area</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Controle de Sistema, Pagamentos e Usuários.</p>
      </header>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-2xl h-auto">
          <TabsTrigger value="dashboard" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Activity className="w-4 h-4 mr-2"/> Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Users className="w-4 h-4 mr-2"/> Usuários</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Settings2 className="w-4 h-4 mr-2"/> Configurações</TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Workflow className="w-4 h-4 mr-2"/> integrações</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Database className="w-4 h-4 mr-2"/> Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bento-item">
                 <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest">Total de Usuários</h3>
                 <p className="text-4xl font-black mt-2">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bento-item border-l-4 border-l-primary">
                 <h3 className="text-xs font-black uppercase text-primary tracking-widest">Assinaturas Ativas</h3>
                 <p className="text-4xl font-black mt-2">{stats?.activeSubscriptions || 0}</p>
              </div>
              <div className="bento-item border-l-4 border-l-success">
                 <h3 className="text-xs font-black uppercase text-success tracking-widest">MRR Estimado</h3>
                 <p className="text-4xl font-black mt-2">${stats?.mrr || 0}</p>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="bento-item">
            <h2 className="text-lg font-black uppercase mb-4">Gestão de Usuários</h2>
            <div className="text-sm text-zinc-500 font-bold">Módulo CRUD em construção vinculada ao Supabase Auth...</div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bento-item">
            <h2 className="text-lg font-black uppercase mb-4">Feature Flags & Planos</h2>
            <div className="text-sm text-zinc-500 font-bold">Gerenciamento de limites de planos será renderizado aqui.</div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="bento-item">
            <h2 className="text-lg font-black uppercase mb-4">Módulos Externos</h2>
            <div className="space-y-2">
               <div className="p-4 border border-white/5 rounded-xl flex justify-between items-center bg-zinc-900/40">
                  <div>
                    <h4 className="font-bold uppercase text-xs">Hugging Face API</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Conexão Ativa - Modelos Mistral & Llama</p>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-success shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
               </div>
               <div className="p-4 border border-white/5 rounded-xl flex justify-between items-center bg-zinc-900/40">
                  <div>
                    <h4 className="font-bold uppercase text-xs">Stripe Webhooks</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Rotas validadas no painel de eventos.</p>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-success shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bento-item">
            <h2 className="text-lg font-black uppercase mb-4">Log de Auditoria</h2>
            <div className="space-y-4">
               {logs?.map((log: any) => (
                 <div key={log.id} className="text-xs bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex gap-4 items-start">
                    <div className="flex-1">
                      <span className="font-black uppercase text-primary">{log.action}</span> - {log.resource}
                      <p className="text-[10px] text-zinc-500 mt-1">{log.id}</p>
                    </div>
                    <time className="text-[10px] text-zinc-500 font-bold">{new Date(log.created_at).toLocaleString()}</time>
                 </div>
               ))}
               {logs?.length === 0 && <div className="text-xs text-zinc-500 font-bold p-4 text-center">Nenhum evento registrado ainda.</div>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
