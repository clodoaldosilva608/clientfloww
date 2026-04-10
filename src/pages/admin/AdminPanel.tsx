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
          <div className="bento-item shadow-xl border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Gestão de Participantes</h2>
              <Button size="sm" className="bg-primary text-white font-bold text-[10px] uppercase rounded-xl"> + Novo Usuário </Button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/40">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                  <tr>
                    <th className="p-4">Identificação</th>
                    <th className="p-4">Status / Nível</th>
                    <th className="p-4">Último Acesso</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                     <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">C</div>
                         <div>
                           <p className="font-bold text-white">clodoaldosilva608@gmail.com</p>
                           <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Usr-0192A</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                          <Activity className="w-3 h-3" /> Admin
                        </span>
                     </td>
                     <td className="p-4 text-xs font-bold text-zinc-400">08 Abr 2026</td>
                     <td className="p-4 text-right flex justify-end gap-2">
                       <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-primary hover:bg-primary/10">Editar</Button>
                       <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-red-500 hover:bg-red-500/10">Remover</Button>
                     </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                     <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs">A</div>
                         <div>
                           <p className="font-bold text-white">agencia@flow.com</p>
                           <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Usr-081B</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest border border-zinc-700">
                          Membro
                        </span>
                     </td>
                     <td className="p-4 text-xs font-bold text-zinc-400">01 Abr 2026</td>
                     <td className="p-4 text-right flex justify-end gap-2">
                       <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-primary hover:bg-primary/10">Editar</Button>
                       <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-red-500 hover:bg-red-500/10">Remover</Button>
                     </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bento-item shadow-xl border-white/5 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight">Preferências do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-sm tracking-wide text-white">Manutenção do Modo AI</h3>
                   <div className="h-6 w-10 bg-primary rounded-full relative shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                     <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                   </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Desative temporariamente a geração de textos via IA para forçar fallback local.</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-sm tracking-wide text-white">Bloqueio de Novos Registros</h3>
                   <div className="h-6 w-10 bg-zinc-800 rounded-full relative">
                     <div className="absolute left-1 top-1 h-4 w-4 bg-zinc-400 rounded-full"></div>
                   </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Impede a criação de novas contas e organizações no ambiente.</p>
              </div>
              
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3 md:col-span-2">
                <h3 className="font-bold text-sm tracking-wide text-white">Limites Globais (Rate Limiting)</h3>
                <div className="flex gap-4 mt-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Max Chamadas/min (HF)</label>
                    <input type="number" defaultValue="20" className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-3 text-xs text-white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Envios por disparo (Cron)</label>
                    <input type="number" defaultValue="500" className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-3 text-xs text-white" />
                  </div>
                </div>
                <Button className="mt-2 text-[10px] uppercase font-black tracking-widest w-fit" size="sm">Atualizar Limites Globais</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="bento-item shadow-xl border-white/5">
            <h2 className="text-lg font-black uppercase mb-6 tracking-tight">Módulos & Conexões Externas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-5 border border-white/5 rounded-2xl flex justify-between items-center bg-zinc-900/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h4 className="font-black uppercase text-xs tracking-wider text-white">Hugging Face API</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">router.huggingface.co/hf-inference</p>
                  </div>
                  <span className="relative z-10 px-2 py-1 bg-success/10 border border-success/20 text-success text-[9px] font-black tracking-widest uppercase rounded">Ativo</span>
               </div>
               <div className="p-5 border border-white/5 rounded-2xl flex justify-between items-center bg-zinc-900/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h4 className="font-black uppercase text-xs tracking-wider text-white">Stripe Webhooks</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">Assinaturas e pagamentos habilitados</p>
                  </div>
                  <span className="relative z-10 px-2 py-1 bg-success/10 border border-success/20 text-success text-[9px] font-black tracking-widest uppercase rounded">Ativo</span>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bento-item shadow-xl border-white/5">
            <h2 className="text-lg font-black uppercase mb-6 tracking-tight">Log de Auditoria e Eventos</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
               {logs?.map((log: any) => (
                 <div key={log.id} className="text-xs bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-white/[0.02] transition">
                    <div className="flex-1">
                      <span className="font-black uppercase text-primary tracking-widest text-[10px] bg-primary/10 px-2 py-1 rounded inline-block mb-2">{log.action}</span>
                      <p className="font-bold text-white mb-1">{log.resource}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{log.id}</p>
                    </div>
                    <time className="text-[10px] text-zinc-500 font-bold whitespace-nowrap bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{new Date(log.created_at).toLocaleString()}</time>
                 </div>
               ))}
               {(!logs || logs.length === 0) && (
                 <div className="flex flex-col items-center justify-center p-8 gap-3 border border-dashed border-white/10 rounded-2xl">
                   <Database className="w-8 h-8 text-zinc-600 mb-2" />
                   <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Nenhum evento registrado no período</p>
                 </div>
               )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
