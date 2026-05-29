import { useState } from "react";
import { ShieldCheck, Users, Settings2, Activity, Database, Building2, CreditCard, UserCog, AlertTriangle, Search, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: adminService.getStats
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: adminService.listUsers
  });

  const { data: organizations } = useQuery({
    queryKey: ["admin_orgs"],
    queryFn: adminService.listOrganizations
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin_subs"],
    queryFn: adminService.listSubscriptions
  });

  const { data: logs } = useQuery({
    queryKey: ["admin_logs"],
    queryFn: adminService.listAuditLogs
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) => adminService.updateUserRole(userId, roleName),
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
    onError: (e: any) => toast.error("Falha ao atualizar", { description: e.message })
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      toast.success("Usuário deletado (Soft Delete).");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
    onError: (e: any) => toast.error("Erro na exclusão", { description: e.message })
  });

  const forceSubMutation = useMutation({
    mutationFn: ({ orgId, planId, status }: { orgId: string; planId: string; status: string }) => adminService.forceSubscription(orgId, planId, status),
    onSuccess: () => {
      toast.success("Plano forçado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin_subs"] });
    },
    onError: (e: any) => toast.error("Erro ao assinar plano", { description: e.message })
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary h-6 w-6" />
            <span className="font-black uppercase tracking-widest text-sm">Painel de Controle</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            Voltar ao Sistema
          </Button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8 p-6 pt-10"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <span className="premium-gradient bg-clip-text text-transparent uppercase">God Mode</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Controle de Sistema, Pagamentos, Organizações e Usuários.</p>
        </header>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-2xl h-auto flex-wrap">
          <TabsTrigger value="dashboard" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Activity className="w-4 h-4 mr-2"/> Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Users className="w-4 h-4 mr-2"/> Usuários</TabsTrigger>
          <TabsTrigger value="orgs" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Building2 className="w-4 h-4 mr-2"/> Organizações</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><CreditCard className="w-4 h-4 mr-2"/> Planos</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Settings2 className="w-4 h-4 mr-2"/> Configurações</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 py-2 data-[state=active]:bg-primary"><Database className="w-4 h-4 mr-2"/> Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bento-item border-l-4 border-l-blue-500">
                 <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest">Total Usuários</h3>
                 <p className="text-4xl font-black mt-2">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bento-item border-l-4 border-l-purple-500">
                 <h3 className="text-xs font-black uppercase text-purple-500 tracking-widest">Organizações</h3>
                 <p className="text-4xl font-black mt-2">{stats?.totalOrgs || 0}</p>
              </div>
              <div className="bento-item border-l-4 border-l-primary">
                 <h3 className="text-xs font-black uppercase text-primary tracking-widest">Assinaturas Ativas</h3>
                 <p className="text-4xl font-black mt-2">{stats?.activeSubscriptions || 0}</p>
              </div>
              <div className="bento-item border-l-4 border-l-success">
                 <h3 className="text-xs font-black uppercase text-success tracking-widest">MRR Estimado</h3>
                 <p className="text-4xl font-black mt-2">R$ {stats?.mrr || 0}</p>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="bento-item shadow-xl border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Gestão de Participantes</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar usuários..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs glass-card border-zinc-800"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/40">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                  <tr>
                    <th className="p-4">Identificação</th>
                    <th className="p-4">ID do Sistema</th>
                    <th className="p-4">Acesso (Role)</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users?.filter(u => u.id.includes(searchTerm) || (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))).map((user: any) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="p-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                             {user.full_name ? user.full_name[0].toUpperCase() : "U"}
                           </div>
                           <div>
                             <p className="font-bold text-white">{user.full_name || "Sem Nome"}</p>
                             <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Membro desde {new Date(user.created_at).toLocaleDateString()}</p>
                           </div>
                         </div>
                       </td>
                       <td className="p-4">
                         <span className="text-xs font-mono text-zinc-400">{user.id}</span>
                       </td>
                       <td className="p-4">
                         {user.user_roles && user.user_roles.length > 0 ? (
                           user.user_roles.map((ur: any) => (
                             <Badge key={ur.role_id} variant="outline" className={`text-[10px] uppercase font-black border-primary/20 ${ur.roles?.name === 'admin' ? 'text-primary' : 'text-zinc-300'}`}>
                               {ur.roles?.name || "user"}
                             </Badge>
                           ))
                         ) : (
                           <Badge variant="outline" className="text-[10px] uppercase font-black border-zinc-800 text-zinc-500">Nenhuma</Badge>
                         )}
                       </td>
                       <td className="p-4 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] uppercase font-black border-zinc-800 hover:text-primary"
                            onClick={() => {
                              const newRole = confirm(`Tornar ${user.id} Administrador? Cancelar para revogar.`) ? 'admin' : 'user';
                              roleMutation.mutate({ userId: user.id, roleName: newRole });
                            }}
                          >
                            Mudar Permissão
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 text-[10px] uppercase font-black bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                            onClick={() => {
                              if(confirm(`Tem certeza que deseja DELETAR o perfil do usuário ${user.id}?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                          >
                            Excluir
                          </Button>
                       </td>
                    </tr>
                  ))}
                  {users?.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Nenhum usuário encontrado. (Se RLS bloquear, utilize service_role).</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orgs">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {organizations?.map((org: any) => (
               <div key={org.id} className="bento-item shadow-xl border-white/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                  <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-black text-lg tracking-tight uppercase text-white">{org.name}</h3>
                       <p className="text-xs text-zinc-500 mt-1">ID: <span className="font-mono">{org.id.split("-")[0]}...</span></p>
                     </div>
                     <Badge className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">{org.organization_users?.length || 0} Membros</Badge>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                     <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Equipe</p>
                     <div className="space-y-2">
                        {org.organization_users?.map((ou: any) => (
                           <div key={ou.user_id} className="flex justify-between text-xs">
                              <span className="text-zinc-300 truncate max-w-[150px]">{ou.profiles?.full_name || ou.user_id.split("-")[0]}</span>
                              <span className="text-zinc-500 uppercase font-black">{ou.role_name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="bento-item shadow-xl border-white/5 space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tight">Gestão de Assinaturas (Forçar Plano)</h2>
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/40">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                  <tr>
                    <th className="p-4">Organização</th>
                    <th className="p-4">Plano (Price ID)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {organizations?.map((org: any) => {
                    const sub = subscriptions?.find((s: any) => s.organization_id === org.id);
                    return (
                      <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                         <td className="p-4 font-medium">{org.name}</td>
                         <td className="p-4 text-xs font-mono text-zinc-400">{sub?.stripe_price_id || "Nenhum"}</td>
                         <td className="p-4">
                           {sub?.status === 'active' ? (
                             <Badge className="bg-success/10 text-success"><CheckCircle2 className="w-3 h-3 mr-1"/> ATIVO</Badge>
                           ) : (
                             <Badge variant="outline" className="text-zinc-500"><XCircle className="w-3 h-3 mr-1"/> INATIVO</Badge>
                           )}
                         </td>
                         <td className="p-4 text-right">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-[10px] uppercase font-black border-zinc-800"
                              onClick={() => {
                                const plan = prompt("Digite o nome ou ID do plano (ex: professional):", "professional");
                                if(plan) forceSubMutation.mutate({ orgId: org.id, planId: plan, status: "active" });
                              }}
                            >
                              Ativar Plano Especial
                            </Button>
                         </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bento-item border border-warning/20 bg-warning/5">
                 <div className="flex gap-4 items-start">
                    <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
                    <div>
                       <h3 className="font-black text-warning uppercase">Modo de Manutenção Global</h3>
                       <p className="text-xs text-zinc-400 mt-1 mb-4">Desativa o acesso de todos os usuários não-admins. O sistema exibirá uma tela de manutenção.</p>
                       <Button variant="outline" className="border-warning/50 text-warning hover:bg-warning hover:text-warning-foreground text-xs uppercase font-black tracking-widest">
                         Ativar Manutenção
                       </Button>
                    </div>
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bento-item shadow-xl border-white/5 space-y-4">
             <h2 className="text-lg font-black uppercase tracking-tight">Logs de Auditoria Recentes</h2>
             {logs?.length ? (
               <div className="space-y-2">
                 {logs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                       <div className="flex gap-4">
                          <span className="font-mono text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                          <span className="font-black text-primary">{log.action}</span>
                          <span className="text-zinc-300">{log.details}</span>
                       </div>
                       <span className="text-zinc-600 font-mono text-[10px]">{log.user_id}</span>
                    </div>
                 ))}
               </div>
             ) : (
               <div className="p-10 text-center border border-dashed border-white/10 rounded-xl">
                 <Database className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                 <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Nenhum registro de auditoria disponível.</p>
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
    </div>
  );
}
