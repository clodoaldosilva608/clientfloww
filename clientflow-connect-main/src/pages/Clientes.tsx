import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, MoreHorizontal, Trash2, Eye, UserPlus, Zap, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clientService } from "@/services/client.service";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, CheckSquare, X, ShieldAlert, Sparkles, Send } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export default function Clientes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await clientService.list(organization.id);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagging, setBulkTagging] = useState(false);
  const [tagValue, setTagValue] = useState("");

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("Unauthorized");
      const { data, error } = await clientService.delete(id, organization.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success("Cliente removido do ClientFlow");
      queryClient.invalidateQueries({ queryKey: ["clients", organization?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir cliente");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!organization?.id) throw new Error("Unauthorized");
      const { data, error } = await clientService.deleteMany(ids, organization.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} clientes removidos do cluster.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["clients", organization?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro na exclusão em massa");
    }
  });

  const bulkTagMutation = useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[], tag: string }) => {
      if (!organization?.id) throw new Error("Unauthorized");
      const { data, error } = await clientService.tagMany(ids, tag, organization.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success(`Tag aplicada em ${selectedIds.length} clientes simultaneamente!`);
      setSelectedIds([]);
      setBulkTagging(false);
      setTagValue("");
      queryClient.invalidateQueries({ queryKey: ["clients", organization?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao taguear em massa");
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClients.length) setSelectedIds([]);
    else setSelectedIds(filteredClients.map(c => c.id));
  };

  const filteredClients = (clients || []).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search)) || 
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-1 space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             <span className="premium-gradient bg-clip-text text-transparent uppercase">Gestão de Clientes</span>
           </h1>
           <p className="text-muted-foreground mt-1 text-sm font-medium">Total de {clients?.length || 0} conexões inteligentes ativas.</p>
        </div>
        <Link to="/clientes/novo">
          <Button className="rounded-xl h-12 px-6 premium-gradient text-white font-black shadow-xl shadow-primary/20 gap-2">
            <UserPlus className="h-5 w-5" /> NOVO CLIENTE
          </Button>
        </Link>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-11 h-12 glass-card rounded-xl border-none shadow-lg shadow-zinc-200/50 dark:shadow-none font-bold text-xs" 
            placeholder="Pesquisar por nome, telefone ou tag..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 w-12 rounded-xl p-0 glass-card border-none hover:bg-muted/50 transition-colors" onClick={toggleSelectAll}>
          <CheckSquare className={`h-4 w-4 ${selectedIds.length > 0 ? 'text-primary' : 'text-zinc-500'}`} />
        </Button>
        <Button variant="outline" className="h-12 w-12 rounded-xl p-0 glass-card border-none">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bento-item h-64 space-y-4">
               <div className="flex gap-3">
                 <Skeleton className="h-12 w-12 rounded-xl" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-3/4" />
                   <Skeleton className="h-3 w-1/2" />
                 </div>
               </div>
               <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client) => (
              <motion.div 
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                key={client.id} 
                className="bento-item group cursor-pointer hover:border-primary/30"
                onClick={() => navigate(`/clientes/${client.id}`)}
              >
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                         <div className="z-10" onClick={(e) => e.stopPropagation()}>
                           <Checkbox 
                             checked={selectedIds.includes(client.id)} 
                             onCheckedChange={() => toggleSelect(client.id)}
                             className="rounded-md border-zinc-500/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                           />
                         </div>
                         <div className="h-12 w-12 rounded-xl premium-gradient flex items-center justify-center text-sm font-black text-white shadow-lg">
                           {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                         </div>
                         <div className="overflow-hidden">
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate uppercase text-xs">{client.name}</h3>
                             {(() => {
                               const lastInteraction = new Date(client.updated_at || client.created_at);
                               const diffDays = Math.floor((new Date().getTime() - lastInteraction.getTime()) / (1000 * 3600 * 24));
                               return diffDays > 15 && (
                                 <Badge variant="destructive" className="h-[14px] text-[7px] font-black px-1 uppercase tracking-tighter animate-pulse">Churn Risk</Badge>
                               );
                             })()}
                           </div>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1 mt-1">
                              <MapPin className="h-2 w-2" /> {client.city || 'Local não informado'}
                           </p>
                         </div>
                       </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-200/50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onClick={() => navigate(`/clientes/${client.id}`)} className="font-bold text-[10px] uppercase">
                          <Eye className="mr-2 h-3.5 w-3.5" /> Visualizar 360°
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive font-black text-[10px] uppercase" 
                          onClick={() => deleteMutation.mutate(client.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate font-bold bg-muted/30 p-2 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span>{client.phone || client.whatsapp_id || 'Sem contato'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[8px] uppercase font-black tracking-widest px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-none">
                         {tag}
                      </Badge>
                    ))}
                    {client.tags.length > 3 && <span className="text-[9px] font-black text-muted-foreground ml-1">+{client.tags.length - 3}</span>}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                   <div className="flex -space-x-1.5">
                      <div className="h-6 w-6 rounded-full border-2 border-background bg-[#25D366] text-[8px] flex items-center justify-center font-black text-white shadow-sm">WA</div>
                      <div className="h-6 w-6 rounded-full border-2 border-background bg-[#0088cc] text-[8px] flex items-center justify-center font-black text-white shadow-sm">TG</div>
                   </div>
                   <span className="text-[10px] font-black text-success flex items-center gap-1 uppercase tracking-tighter">
                      <Zap className="h-3 w-3 fill-current" /> Alta Fidelidade
                   </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 text-center glass-card rounded-2xl">
          <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Nenhum conexão inteligente encontrada.</p>
          <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary uppercase text-[10px] font-black">Limpar Busca</Button>
        </div>
      )}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
                   {selectedIds.length}
                 </div>
                 <div className="flex flex-col">
                   <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Ações em Massa</h4>
                   <button onClick={() => setSelectedIds([])} className="text-[9px] font-bold uppercase text-zinc-500 hover:text-white flex items-center gap-1">
                     <X className="h-2.5 w-2.5" /> Desmarcar Todos
                   </button>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                {bulkTagging ? (
                  <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
                    <Input 
                      placeholder="Tag..." 
                      className="h-8 w-24 bg-transparent border-none text-[10px] uppercase font-black placeholder:text-zinc-700"
                      value={tagValue}
                      onChange={(e) => setTagValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && bulkTagMutation.mutate({ ids: selectedIds, tag: tagValue })}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 rounded-xl bg-primary hove:bg-primary/90 text-[10px] font-black uppercase"
                      onClick={() => bulkTagMutation.mutate({ ids: selectedIds, tag: tagValue })}
                    >
                      OK
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => setBulkTagging(false)}><X className="h-4 w-4" /></Button>
                  </motion.div>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="h-11 rounded-2xl border-white/5 glass-card text-[10px] font-black uppercase tracking-widest gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      onClick={() => setBulkTagging(true)}
                    >
                      <Tag className="h-3.5 w-3.5" /> Taguear
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-11 rounded-2xl border-white/5 glass-card text-[10px] font-black uppercase tracking-widest gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir ${selectedIds.length} clientes? Esta ação é irreversível.`)) {
                          bulkDeleteMutation.mutate(selectedIds);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
