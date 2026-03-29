import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Button } from '@/components/ui/button';
import { Save, Play, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Trigger: Cliente Criado' },
    position: { x: 250, y: 5 },
  },
];

const WorkflowBuilderContent = () => {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node`, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const handleSave = async () => {
    toast.loading("Salvando automação indústrial...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Obter organization_id ativa
      const { data: orgData, error: orgErr } = await (supabase as any)
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();
      
      if (orgErr || !orgData) throw new Error("Organização não encontrada");

      const organizationId = orgData.organization_id;

      // 1. Criar Payload do Workflow
      const { data: wf, error: wfErr } = await (supabase as any).from("flows").insert({
        name: "Automação Nexus Builder",
        active: true,
        organization_id: organizationId,
        user_id: user.id
      }).select().single();

      if (wfErr) throw wfErr;

      // 2. Criar Payload de Steps (Nós) com validação de tipo
      const steps = nodes.map((node, index) => ({
        flow_id: wf.id,
        type: node.type || 'send_message',
        config: node.data.config || {},
        step_order: index + 1,
        organization_id: organizationId,
        user_id: user.id
      }));

      const { error: stepsErr } = await (supabase as any).from("flow_steps").insert(steps);
      
      if (stepsErr) throw stepsErr;
      
      toast.dismiss();
      toast.success("Workflow indústrial ativado com sucesso!", { description: "Pronto na engine de automação." });
    } catch (e: any) {
      toast.dismiss();
      toast.error("Falha ao salvar workflow de automação.", { description: e.message });
      console.error("[Workflow Builder Save Error]:", e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-zinc-400">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-[1px] bg-zinc-800" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest premium-gradient bg-clip-text text-transparent">Workflow Builder</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Motor de Automação ClientFlow</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="border-zinc-800 text-[10px] font-black uppercase tracking-widest gap-2">
            <Play className="h-3 w-3" /> <span className="hidden sm:inline">Testar Fluxo</span>
          </Button>
          <Button onClick={handleSave} size="sm" className="premium-gradient text-white text-[10px] font-black uppercase tracking-widest gap-2 border-none">
            <Save className="h-3 w-3" /> <span className="hidden sm:inline">Persistir Automação</span>
            <span className="sm:hidden">Salvar</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Node Palette */}
        <NodePalette />

        {/* Main Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
            style={{ background: '#09090b' }}
          >
            <Background color="#27272a" gap={20} />
            <Controls className="!bg-zinc-900 !border-zinc-800 !fill-white" />
            <MiniMap 
               nodeStrokeColor={(n) => n.type === 'input' ? '#00d2ff' : '#9333ea'}
               maskColor="rgba(0, 0, 0, 0.7)"
               className="!bg-zinc-900 !border-zinc-800"
            />
          </ReactFlow>
        </div>

        {/* Right Sidebar: Config Panel */}
        <NodeConfigPanel node={selectedNode} onChange={(nodeId, config) => {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n));
        }} />
      </div>
    </div>
  );
};

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
