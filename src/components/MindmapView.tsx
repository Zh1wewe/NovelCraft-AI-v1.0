import React, { useMemo, useCallback, useEffect } from 'react';
import { Network, FileText, Plus, Trash2, GripHorizontal, GitCommit, GitBranch } from 'lucide-react';
import { StoryNode } from '../types';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Handle,
  Position,
  Node as FlowNode,
  Edge as FlowEdge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface MindmapViewProps {
  nodes: StoryNode[];
  onGoToOutline: (id: string) => void;
  onAddNode: (parentId?: string, nodeType?: 'main' | 'branch') => void;
  onUpdateNode: (id: string, updates: Partial<StoryNode>) => void;
  onDeleteNode: (id: string) => void;
  style?: React.CSSProperties;
}

const CustomMindmapNode = ({ data, isConnectable }: any) => {
  const { node, onAddNode, onGoToOutline, onUpdateNode, onDeleteNode } = data;

  return (
    <div className="bg-white/90 border border-indigo-200/50 shadow-md hover:shadow-xl hover:border-indigo-400 rounded-xl transition-all group relative backdrop-blur-sm w-72 h-44 flex flex-col">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!w-2 !h-8 !bg-indigo-100 !border !border-indigo-300 hover:!bg-indigo-400 !rounded-r-none !rounded-l-full !-ml-1 cursor-crosshair z-10 transition-colors opacity-80" />
      
      {/* Drag Handle */}
      <div className="absolute bottom-0 right-0 p-2 text-indigo-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing custom-drag-handle transition-colors z-20 backdrop-blur-sm rounded-br-xl bg-white/50" title="拖拽卡片">
        <GripHorizontal className="w-5 h-5" />
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20 nodrag">
         <button onClick={(e) => { e.stopPropagation(); onAddNode(node.id, 'main'); }} className="p-1 hover:bg-blue-50 text-blue-500 rounded bg-white shadow-sm border border-blue-100" title="添加为主线阶段的下一段">
           <GitCommit className="w-3.5 h-3.5" />
         </button>
         <button onClick={(e) => { e.stopPropagation(); onAddNode(node.id, 'branch'); }} className="p-1 hover:bg-green-50 text-green-500 rounded bg-white shadow-sm border border-green-100" title="添加为其分支情节">
           <GitBranch className="w-3.5 h-3.5" />
         </button>
         <button onClick={(e) => { e.stopPropagation(); onGoToOutline(node.id); }} className="p-1 hover:bg-indigo-50 text-indigo-500 rounded bg-white shadow-sm border border-indigo-100" title="在大纲中编辑">
           <FileText className="w-3.5 h-3.5" />
         </button>
         <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }} className="p-1 hover:bg-red-50 text-red-500 rounded bg-white shadow-sm border border-red-100" title="删除">
           <Trash2 className="w-3.5 h-3.5" />
         </button>
      </div>

      <div className="p-4 nodrag flex-1 flex flex-col cursor-text mt-4 overflow-hidden">
        {node.timeLabel && (
          <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-1 opacity-80 shrink-0">
            {node.timeLabel}
          </div>
        )}

        <h3 
          className="font-bold text-gray-800 text-sm mb-1 outline-none focus:bg-white/90 focus:ring-2 focus:ring-indigo-100 p-1 -mx-1 rounded shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdateNode(node.id, { title: e.currentTarget.textContent || '无标题' })}
          title={node.title}
        >
          {node.title}
        </h3>
        <p 
          className="text-xs text-gray-500 line-clamp-4 leading-relaxed outline-none focus:bg-white/90 focus:ring-2 focus:ring-indigo-100 p-1 -mx-1 rounded break-words flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdateNode(node.id, { summary: e.currentTarget.textContent || '' })}
        >
          {node.summary}
        </p>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!w-2 !h-8 !bg-indigo-100 !border !border-indigo-300 hover:!bg-indigo-400 !rounded-l-none !rounded-r-full !-mr-1 cursor-crosshair z-10 transition-colors opacity-80" />
    </div>
  );
};

const nodeTypes = {
  customMindmapNode: CustomMindmapNode,
};

const getLayoutedElements = (nodes: FlowNode[], edges: FlowEdge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 140 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    if (!newNode.position || (newNode.position.x === 0 && newNode.position.y === 0)) {
       newNode.position = {
         x: nodeWithPosition.x - 140,
         y: nodeWithPosition.y - 70,
       };
    }
    return newNode;
  });

  return { layoutedNodes, layoutedEdges: edges };
};

const MindmapFlow: React.FC<MindmapViewProps> = ({ nodes, onGoToOutline, onAddNode, onUpdateNode, onDeleteNode, style }) => {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Generate initial nodes and edges from StoryNode list
    let tempNodes: FlowNode[] = [];
    let tempEdges: FlowEdge[] = [];

    nodes.forEach(n => {
      tempNodes.push({
        id: n.id,
        type: 'customMindmapNode',
        position: n.position || { x: 0, y: 0 },
        data: { node: n, onAddNode, onGoToOutline, onUpdateNode, onDeleteNode }
      });

      const uniqueParentIds = new Set<string>();
      if (n.parentId) uniqueParentIds.add(n.parentId);
      if (n.parentIds && Array.isArray(n.parentIds)) {
        n.parentIds.forEach(pId => uniqueParentIds.add(pId));
      }

      uniqueParentIds.forEach(pId => {
        tempEdges.push({
          id: `e-${pId}-${n.id}`,
          source: pId,
          target: n.id,
          animated: false,
          style: { stroke: '#818cf8', strokeWidth: 2 }
        });
      });
    });

    // Auto layout nodes that have unassigned positions
    const { layoutedNodes, layoutedEdges } = getLayoutedElements(tempNodes, tempEdges);
    setFlowNodes(layoutedNodes);
    setFlowEdges(layoutedEdges);
  }, [nodes, onAddNode, onGoToOutline, onUpdateNode, onDeleteNode, setFlowNodes, setFlowEdges]);

  // Handle saving dragged positions map to model
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: FlowNode) => {
     onUpdateNode(node.id, { position: node.position });
  }, [onUpdateNode]);

  // Handle edge creation (linking parent -> child visually and updating backend)
  const onConnect = useCallback((params: Connection) => {
     if (params.source && params.target) {
       const targetNode = nodes.find(n => n.id === params.target);
       if (targetNode) {
          const currentParentIds = Array.isArray(targetNode.parentIds) ? [...targetNode.parentIds] : [];
          if (targetNode.parentId && !currentParentIds.includes(targetNode.parentId)) {
              currentParentIds.push(targetNode.parentId);
          }
          if (!currentParentIds.includes(params.source)) {
              currentParentIds.push(params.source);
          }
          onUpdateNode(params.target, { parentIds: currentParentIds, parentId: currentParentIds[0] });
       }
     }
     setFlowEdges((eds) => addEdge({ ...params, animated: false, style: { stroke: '#818cf8', strokeWidth: 2 } } as any, eds));
  }, [setFlowEdges, onUpdateNode, nodes]);

  return (
    <div className="flex-1 h-full w-full relative" style={style}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#c7d2fe" gap={16} />
        <Controls className="bg-white/70 backdrop-blur-sm" />
        <MiniMap 
          nodeColor="#e0e7ff"
          maskColor="rgba(255,255,255,0.4)"
          className="bg-white/50 backdrop-blur-sm rounded-lg shadow-sm"
        />
        <Panel position="top-right" className="bg-white/80 backdrop-blur-md px-4 py-2 flex gap-3 shadow-md border border-indigo-100 rounded-lg m-4">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-800">拓扑结构导图</h2>
          </div>
          <button 
            onClick={() => onAddNode("")}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 添加根节点
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const MindmapView: React.FC<MindmapViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindmapFlow {...props} />
    </ReactFlowProvider>
  );
};
