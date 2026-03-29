import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Zap, MessageSquare, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  node: Node | null;
  onChange: (nodeId: string, config: any) => void;
}

export const NodeConfigPanel = ({ node, onChange }: Props) => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
    }
  }, [node]);

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (node) {
      onChange(node.id, newConfig);
    }
  };

  if (!node) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 rounded-full bg-zinc-900 mb-4">
          <Settings2 className="h-6 w-6 text-zinc-600" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Configuração</h3>
        <p className="text-[10px] text-zinc-700 mt-2 italic">Selecione um componente no canvas para editar suas propriedades.</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950/50 p-6 space-y-8 overflow-y-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-primary/10 rounded-xl">
              <Settings2 className="h-4 w-4 text-primary" />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest">{node.type}</h3>
             <p className="text-[9px] text-zinc-500 font-bold uppercase">{node.id}</p>
           </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Render specific inputs based on node type */}
        {node.type === 'trigger' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Evento de Gatilho</Label>
              <Select value={config.triggerType} onValueChange={(val) => updateConfig('triggerType', val)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="client_created">Cliente Criado</SelectItem>
                  <SelectItem value="tag_added">Tag Adicionada</SelectItem>
                  <SelectItem value="message_received">Mensagem Recebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {node.type === 'send_message' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Plataforma</Label>
              <Select value={config.platform} onValueChange={(val) => updateConfig('platform', val)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Escolha a rede" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                  <SelectItem value="telegram">Telegram Bot</SelectItem>
                  <SelectItem value="instagram">Instagram Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Conteúdo da Mensagem</Label>
              <Textarea 
                className="bg-zinc-900 border-zinc-800 text-xs min-h-[120px] resize-none" 
                placeholder="Olá {{client_name}}, como podemos ajudar?" 
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
              />
            </div>
          </div>
        )}

        {node.type === 'wait' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Duração da Espera</Label>
              <div className="flex gap-2">
                <Input 
                  className="bg-zinc-900 border-zinc-800 text-xs" 
                  type="number" 
                  placeholder="10" 
                  value={config.duration || ''}
                  onChange={(e) => updateConfig('duration', e.target.value)}
                />
                <Select value={config.unit} onValueChange={(val) => updateConfig('unit', val)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs w-32">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Generic fields for all nodes */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic leading-relaxed">
             "Configurações automáticas são persistidas dinamicamente no motor de execução para cada nó do grafo."
           </p>
        </div>
      </div>
    </div>
  );
};
