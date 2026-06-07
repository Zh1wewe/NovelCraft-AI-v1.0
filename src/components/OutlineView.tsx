import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Share2, Plus, Network, FileText, MessageSquarePlus, ChevronDown, ChevronRight, GitCommit, GitBranch, ArrowDownCircle } from 'lucide-react';
import { StoryNode } from '../types';

interface OutlineViewProps {
  nodes: StoryNode[];
  activeNodeId: string;
  onNodeSelect: (id: string) => void;
  onGoToMindmap: (id: string) => void;
  onAddNode: (parentId?: string, nodeType?: 'main' | 'branch') => void;
  onUpdateNode: (id: string, updates: Partial<StoryNode>) => void;
  onDeleteNode: (id: string) => void;
  style?: React.CSSProperties;
}

export const OutlineView: React.FC<OutlineViewProps> = ({ nodes, activeNodeId, onNodeSelect, onGoToMindmap, onAddNode, onUpdateNode, onDeleteNode, style }) => {
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeNodeId && nodeRefs.current[activeNodeId]) {
      nodeRefs.current[activeNodeId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeNodeId]);

  const toggleBranch = (id: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChildren = useCallback((nodeId: string) => {
    return nodes.filter(n => 
      (n.parentId === nodeId || (n.parentIds && n.parentIds.includes(nodeId)))
      && n.nodeType !== 'main'
    );
  }, [nodes]);

  const rootNodes = useMemo(() => {
    let roots = nodes.filter(n => n.nodeType === 'main' || (!n.parentId && (!n.parentIds || n.parentIds.length === 0)));
    if (roots.length === 0 && nodes.length > 0) {
      roots = [nodes[0]];
    }
    // Also add any node that is somehow neither a child logically nor a root
    const rootIds = new Set(roots.map(r => r.id));
    const allChildIds = new Set(nodes.flatMap(n => getChildren(n.id).map(c => c.id)));
    
    nodes.forEach(n => {
      if (!rootIds.has(n.id) && !allChildIds.has(n.id)) {
        roots.push(n);
      }
    });

    return roots;
  }, [nodes, getChildren]);

  const renderTimelineSidebarNode = (node: StoryNode, depth = 0) => {
    const children = getChildren(node.id);
    const isActive = activeNodeId === node.id;
    
    return (
      <div key={`sidebar-${node.id}`} className="flex flex-col">
        <div 
          onClick={() => onNodeSelect(node.id)}
          className={`group flex gap-2 py-2 px-2 cursor-pointer rounded-md transition-colors ${
            isActive ? 'bg-blue-50/80 shadow-sm' : 'hover:bg-gray-50/60'
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          <div className="relative mt-1">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300 ${
              isActive ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-gray-300 group-hover:bg-gray-400'
            }`}></div>
            {children.length > 0 && (
              <div className="absolute top-[14px] bottom-[-24px] left-[4px] w-[2px] bg-gray-200/60"></div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {node.timeLabel && (
              <div className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-0.5 opacity-80">
                {node.timeLabel}
              </div>
            )}
            <div className={`text-xs font-semibold truncate transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
              {node.title}
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <div className="flex flex-col relative">
            {children.map(child => renderTimelineSidebarNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderContentNode = (node: StoryNode, isChild: boolean = false) => {
    const children = getChildren(node.id);
    const isExpanded = expandedBranches.has(node.id);

    return (
      <div 
        key={`content-${node.id}`} 
        ref={(el) => nodeRefs.current[node.id] = el}
        id={`node-${node.id}`}
        className={`group/node relative p-5 rounded-xl border transition-all duration-200 ${
           isChild 
            ? 'mx-0 bg-gray-50/50 border-gray-100 hover:border-gray-300 border-l-4 border-l-green-400 mb-4' 
            : '-mx-5 border-transparent hover:border-blue-200/60 hover:bg-white/80 hover:shadow-sm'
        }`}
      >
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            {!isChild && children.length > 0 && (
              <button 
                onClick={() => toggleBranch(node.id)}
                className="opacity-0 group-hover/node:opacity-100 text-gray-400 hover:text-blue-600 p-0.5 rounded transition-opacity"
                title="展开/收起分支情节"
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}
            <h3 
              className={`font-bold transition-colors outline-none focus:bg-white/90 p-1 -mx-1 rounded ${
                isChild ? 'text-lg text-gray-800 focus:ring-1 focus:ring-green-100' : 'text-xl text-gray-900 group-hover/node:text-blue-700'
              }`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateNode(node.id, { title: e.currentTarget.textContent || '无标题' })}
            >
              {node.title}
            </h3>
          </div>
          
          <div className="opacity-0 group-hover/node:opacity-100 transition-opacity flex gap-2">
            <button 
              className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> 发起讨论
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAddNode(node.id, 'branch'); }}
              className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" /> 加分支
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAddNode(node.id, 'main'); }}
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5" /> 续接主干
            </button>
            <button 
              onClick={() => onGoToMindmap(node.id)}
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-colors"
            >
              <Network className="w-3.5 h-3.5" /> 导图
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
              className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
            >
              删除
            </button>
          </div>
        </div>

        <div 
          className="text-gray-800 text-[16px] leading-relaxed outline-none focus:bg-white/90 p-2 -mx-2 rounded transition-colors selection:bg-blue-200 focus:ring-1 focus:ring-blue-100"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => onNodeSelect(node.id)}
          onBlur={(e) => onUpdateNode(node.id, { content: e.currentTarget.textContent || '' })}
        >
          {node.content}
        </div>

        {/* Child Nodes Drawer */}
        {children.length > 0 && isExpanded && (
          <div className="mt-6 ml-4 pl-4 border-l-2 border-indigo-100 space-y-6">
            {children.map(child => renderContentNode(child, true))}
            {isChild && (
              <button 
                onClick={() => onNodeSelect(node.id)}
                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <ArrowDownCircle className="w-4 h-4" /> 回到主线后续
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-full bg-transparent overflow-hidden" style={style}>
      {/* Sidebar: Timeline Outline Index */}
      <div className="w-[300px] border-r border-gray-200/50 flex flex-col bg-white/40 z-10">
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-gray-800">大纲时间线</h2>
          <button 
            onClick={() => onAddNode(undefined, 'main')}
            className="p-1.5 hover:bg-white/80 rounded text-gray-500 hover:text-black transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="relative">
            {rootNodes.map(root => renderTimelineSidebarNode(root, 0))}
            {nodes.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">暂无节点</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Continuous Reading View */}
      <div className="flex-1 flex flex-col bg-white/60">
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/40 sticky top-0 z-10 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">整体大纲阅读</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
              <Share2 className="w-4 h-4" /> 导出大纲
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 relative scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {rootNodes.length > 0 ? rootNodes.map((node) => renderContentNode(node)) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-32">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p>暂无大纲节点，请在左侧或向 AI 助手请求生成。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

