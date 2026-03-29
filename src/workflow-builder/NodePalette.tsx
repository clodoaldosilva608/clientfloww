import React from 'react';
import { 
  Zap, 
  MessageSquare, 
  Clock, 
  Tag, 
  Globe, 
  UserCog, 
  GitBranch,
  Split 
} from 'lucide-react';

const nodeTypes = [
  { type: 'trigger', label: 'Gatilho', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  { type: 'send_message', label: 'Enviar Mensagem', icon: MessageSquare, color: 'text-accent', bg: 'bg-accent/10' },
  { type: 'wait', label: 'Aguardar', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  { type: 'condition', label: 'Condição (IF)', icon: Split, color: 'text-info', bg: 'bg-info/10' },
  { type: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'text-success', bg: 'bg-success/10' },
  { type: 'update_client', label: 'Atualizar Cliente', icon: UserCog, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { type: 'webhook', label: 'Webhook HTTP', icon: Globe, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
];

export const NodePalette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 px-2">Componentes de Fluxo</h3>
        <div className="grid grid-cols-1 gap-2">
          {nodeTypes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(event) => onDragStart(event, node.type)}
              className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className={`p-2 rounded-lg ${node.bg} transition-transform group-hover:scale-110`}>
                <node.icon className={`h-4 w-4 ${node.color}`} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-zinc-300">{node.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-[9px] leading-relaxed text-zinc-500 italic">
          Arraste os componentes para o canvas central para construir sua automação.
        </p>
      </div>
    </div>
  );
};
