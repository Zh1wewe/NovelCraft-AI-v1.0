import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Bot, User, Send, Check, X, Move, AlertCircle, 
  FolderSearch, FileText, FileEdit, DatabaseZap, Loader2, RefreshCw, Trash2
} from 'lucide-react';
import { ChatMessage, NovelProject, ConceptCategory, ConceptImage } from '../types';

interface GlobalAIWidgetProps {
  currentProject: NovelProject;
  updateCurrentProject: (updates: Partial<NovelProject> | ((prev: NovelProject) => Partial<NovelProject>)) => void;
  onRefreshConcepts?: () => Promise<void> | void;
  settings: {
    apiUrl: string;
    apiKey: string;
    customModel: string;
  };
}

export const GlobalAIWidget: React.FC<GlobalAIWidgetProps> = ({
  currentProject,
  updateCurrentProject,
  onRefreshConcepts,
  settings
}) => {
  // Draggable floating ball state & positions
  // Initial position in the bottom left corner
  const [position, setPosition] = useState({ x: 30, y: window.innerHeight - 110 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);

  // Open/Close of Global AI Chat Sidebar
  const [isOpen, setIsOpen] = useState(false);

  // Chat message stream details
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`global_ai_msgs_v1_${currentProject?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome-global',
          role: 'assistant',
          content: '👋 你好！我是物理档案与设定文件“全局AI档案管家”。我专注管理小说物理磁盘、世界观文本及资料文献，不涉及章节剧情脑暴。\n\n你可以随时向我下达物理库检索与写入指令！\n\n',
          type: 'text'
        }
      ];
    } catch(e) {
      return [];
    }
  });

  // Keep scroll focused
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [hiddenUpToIndex, setHiddenUpToIndex] = useState<number>(0);

  // Sync state to local storage when changed
  useEffect(() => {
    if (currentProject?.id && messages.length > 0) {
      localStorage.setItem(`global_ai_msgs_v1_${currentProject.id}`, JSON.stringify(messages));
    }
  }, [messages, currentProject?.id]);

  // Handle system-level orientation changes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        // Keeps inside safe boundaries
        const boundX = Math.max(10, Math.min(prev.x, window.innerWidth - 70));
        const boundY = Math.max(10, Math.min(prev.y, window.innerHeight - 100));
        return { x: boundX, y: boundY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [userHasScrolled, setUserHasScrolled] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setUserHasScrolled(false);
    } else {
      setUserHasScrolled(true);
    }
  };

  useEffect(() => {
    if (!userHasScrolled && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isGenerating, userHasScrolled]);

  // Pointer dragging events to bypass iframe boundary traps
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
    // Attach event listeners for movement
    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - dragStartRef.current.x;
      const deltaY = moveEv.clientY - dragStartRef.current.y;
      
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      // Constrain dragging bounds within viewport safely
      const newX = Math.max(15, Math.min(dragStartRef.current.posX + deltaX, window.innerWidth - 75));
      const newY = Math.max(15, Math.min(dragStartRef.current.posY + deltaY, window.innerHeight - 75));
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleBallClick = () => {
    // If we've dragged, don't trigger click action
    if (hasMovedRef.current) return;
    setIsOpen(prev => !prev);
  };

  // Parses tool block schema nested in AI output
  const parseToolCall = (content: string) => {
    try {
      const argsMatch = content.match(/<args>([\s\S]*?)<\/args>/);
      if (argsMatch) {
         let argsStr = argsMatch[1];
         argsStr = argsStr.replace(/^\s*```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
         return JSON.parse(argsStr);
      }
    } catch (e) {}
    return null;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isGenerating) return;

    const userText = inputVal.trim();
    if (userText.toLowerCase() === 'clear') {
      setHiddenUpToIndex(messages.length);
      setInputVal('');
      return;
    }
    
    setInputVal('');

    const newUsrMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      type: 'text'
    };

    setMessages(prev => [...prev, newUsrMsg]);
    setIsGenerating(true);

    const pendingMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: pendingMsgId,
      role: 'assistant',
      content: '正在检索物理数据库与设定文件...',
      type: 'text'
    }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const GLOBAL_AI_SYSTEM_PROMPT = `你是一位专门负责本地物理小说设定档与库文件检索、阅读、更新与追加入档的“全局物理文件AI管家”。
你被集成于小说物理创作库的后台。你的唯一职责是协助作者编辑、检索、阅读其本地物理文件夹（如 参考资料库、核心设定集、草稿、正文 等）中的文本档案。

你支持以下操作形式：
1. 检索列举书籍中的相关物理文件：用户问“查找克苏鲁的数据库”或“检索克苏鲁有关内容”，你应该返回检索工具（query中存放筛选词）：
   <args>{"action": "search_library_files", "query": "克苏鲁"}</args>
2. 阅读内容：用户问“读一下 克苏鲁神秘学引论.txt的详情”、“看一看 核心设定集/法理与地理设定.md”，你应该返回读取工具：
   <args>{"action": "read_library_file", "filePath": "参考资料库/克苏鲁神秘学引论.txt"}</args>
3. 修改或写入设定：用户说“帮我增加一条信息，克苏鲁其实是假的，写入到 克苏鲁神秘学引论.txt中”，你必须发起编辑命令（mode属性可填追加 append 或覆盖 overwrite）：
   <args>{"action": "edit_library_file", "filePath": "参考资料库/克苏鲁神秘学引论.txt", "content": "克苏鲁其实是假的。", "mode": "append"}</args>
   【关键提示】：所有的追加或覆盖编辑，你只需发起一键提案，随后用户在界面上点击“确认”后会自动保存至其物理磁盘上，请用富有信服力的口吻引导用户点击确认。
   【关键约束】：filePath参数必须是物理硬盘之中的相对文件路径名，通常可通过 search_library_files 先行查询获知（如 "参考资料库/克苏鲁神秘学引论.txt" 或 "小说草稿/末日迷雾_前瞻试写.txt"等）。

不要涉及无关的剧情大纲、章节拟定、多视角改写或讨论，你只负责物理资料库的交互。时刻保持专业、克制且井井有条的文献风格，指引或提示作者如何利用底层物理档案系统进行编辑。`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(newUsrMsg).map(m => ({ role: m.role, text: m.content })),
          context: `全局物理资产库。当前小说目录: ${currentProject?.name || ''}`,
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
          model: settings.customModel,
          systemPrompt: GLOBAL_AI_SYSTEM_PROMPT,
          novelName: currentProject?.name || ''
        })
      });

      if (!response.ok) {
        throw new Error('物理通道通信失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamContent = '';
      let isDone = false;
      let sseBuffer = '';

      if (reader) {
        while (!isDone) {
          const { value, done } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }
          sseBuffer += decoder.decode(value, { stream: true });
          const parts = sseBuffer.split('\n');
          sseBuffer = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (!line) continue;
            if (line.startsWith('data:')) {
              const dataVal = line.slice(5).trim();
              if (dataVal === '[DONE]') {
                isDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataVal);
                if (parsed.text !== undefined) {
                  streamContent += parsed.text;
                  setMessages(prev => prev.map(m => {
                    if (m.id === pendingMsgId) {
                      const isToolCall = streamContent.includes('<tool_call>') || streamContent.includes('<args>');
                      return {
                        ...m,
                        content: streamContent,
                        type: isToolCall ? 'tool_call' : 'text'
                      };
                    }
                    return m;
                  }));
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch(err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m => {
          if (m.id === pendingMsgId) {
            return {
              ...m,
              content: `❌ 通信通道发生异常：${err.message || '模型未加载或连接中断'}。请检查基础AI设置与通道状况。`,
              type: 'text'
            };
          }
          return m;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Executes AI's parsed local tool proposal Physically!
  const executeToolCall = async (msgId: string, content: string) => {
    const args = parseToolCall(content);
    if (!args) return;

    // Set proposal status to 'adopted' immediately
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, proposalStatus: 'adopted' } : m));

    // Inject temporary execution message
    const taskLoadId = 'task-loader-' + Date.now();
    setMessages(prev => [...prev, {
      id: taskLoadId,
      role: 'system',
      content: `⚡️ 正在调用底层接口执行 「${args.action}」 磁盘硬盘指令...`,
      type: 'text'
    }]);

    try {
      if (args.action === 'search_library_files') {
        const findFilesRec = (nodes: any[], q: string): any[] => {
          let list: any[] = [];
          for (const n of nodes) {
            if (n.type === 'file') {
              if (!q || n.name.toLowerCase().includes(q.toLowerCase()) || n.relativePath.toLowerCase().includes(q.toLowerCase())) {
                list.push(n);
              }
            } else if (n.children) {
              list = list.concat(findFilesRec(n.children, q));
            }
          }
          return list;
        };

        const resp = await fetch('/api/documents');
        const data = await resp.json();
        
        // Remove loader and insert outcome
        setMessages(prev => prev.filter(m => m.id !== taskLoadId));

        if (data.success && data.tree) {
          const matched = findFilesRec(data.tree, args.query || '');
          const matchedList = matched.map(f => `- 📂 \`${f.relativePath}\` (名称: ${f.name})`).join('\n');
          const resultMsg = matched.length > 0 
            ? `🔍 **全局库检索匹配报告**：在您的真机硬盘中，成功发现以下目标文件及文案目录：\n\n${matchedList}\n\n*支持对上述路径下达进一步的“读取内容”或“写入/追加信息”指令，轻松管理文献。*`
            : `🔍 **全局库检索匹配报告**：在现有的参考库和草稿树中，未寻回任何含有“${args.query || ''}”的记录。您可以随意创建一个。`;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: resultMsg,
            type: 'text'
          }]);
        } else {
          throw new Error('未检索到空文件夹目录');
        }

      } else if (args.action === 'read_library_file') {
        const resp = await fetch(`/api/documents/read?path=${encodeURIComponent(args.filePath)}`);
        const data = await resp.json();

        setMessages(prev => prev.filter(m => m.id !== taskLoadId));

        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `📖 **成功高速读取物理磁盘【${args.filePath}】档案记录：**\n\n\`\`\`text\n${data.content || '（该档案目前无内容，可以往其写入全新数据设定）'}\n\`\`\``,
            type: 'text'
          }]);
        } else {
          throw new Error(`读取档案缺失: ${data.error || '文件不存在或路径不正确'}`);
        }

      } else if (args.action === 'edit_library_file') {
        let originalContent = '';
        const mode = args.mode || 'append';

        if (mode === 'append') {
          try {
            const resp = await fetch(`/api/documents/read?path=${encodeURIComponent(args.filePath)}`);
            const data = await resp.json();
            if (data.success) {
              originalContent = data.content || '';
            }
          } catch(e) {}
        }

        let newContent = '';
        if (mode === 'append') {
          if (originalContent) {
            newContent = originalContent.endsWith('\n') 
              ? (originalContent + args.content) 
              : (originalContent + '\n' + args.content);
          } else {
            newContent = args.content;
          }
        } else {
          newContent = args.content;
        }

        const saveResp = await fetch('/api/documents/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            relativePath: args.filePath,
            content: newContent
          })
        });

        const saveResult = await saveResp.json();
        setMessages(prev => prev.filter(m => m.id !== taskLoadId));

        if (saveResult.success) {
          // If concept images were touched, invoke a background refresh in the parent if registered
          if (args.filePath.includes('概念设计图') && onRefreshConcepts) {
            onRefreshConcepts();
          }

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `✅ **物理设定写入保存成功！**\n\n文件路径: \`${args.filePath}\`\n- **录入信息设定**: 「${args.content}」\n- **物理写入策略**: ${mode === 'append' ? '底端自动回车追加' : '全盘清空覆盖写入'}\n\n已秒级同步回写真实本地磁盘。您现在可以在相应的编辑器或资料页中查看最新状态！`,
            type: 'text'
          }]);
        } else {
          throw new Error(saveResult.error || '保存写入发生错误');
        }
      }
    } catch(err: any) {
      setMessages(prev => prev.filter(m => m.id !== taskLoadId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `❌ **真机硬件指令执行失败：** ${err.message || '权限不足或路径不可读写'}。`,
        type: 'text'
      }]);
    }
  };

  const declineProposal = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, proposalStatus: 'declined' } : m));
  };

  const clearChatHistory = () => {
    if (confirm('确认清空全局AI的使用历史吗？')) {
      setMessages([
        {
          id: 'welcome-global',
          role: 'assistant',
          content: '👋 你好！我是物理档案与设定文件“全局AI档案管家”。我已经归档并为您清空了之前的通信日志。\n\n需要我为您查找、阅读或者编辑什么本地小说文件或核心设定文本吗？请随时吩咐！',
          type: 'text'
        }
      ]);
    }
  };

  return (
    <>
      {/* 1. Fully Draggable & Pulse Glowing AI Sphere Ball (Bottom-Left Corner) */}
      <button
        active-element=""
        id="global-ai-floating-sphere"
        onPointerDown={handlePointerDown}
        onClick={handleBallClick}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none'
        }}
        className={`fixed z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all outline-none border cursor-pointer select-none
          ${isOpen 
            ? 'bg-gradient-to-tr from-slate-900 to-indigo-950 text-sky-400 border-sky-400/50 shadow-sky-500/20' 
            : 'bg-gradient-to-tr from-neutral-900 via-slate-900 to-blue-950 text-white border-blue-500/40 hover:border-sky-400 shadow-blue-900/30'
          }
          ${isDragging ? 'scale-105 cursor-grabbing opacity-90' : 'hover:scale-110 active:scale-95'}
        `}
        title="拖动改变位置，点击开启/关闭「全局AI设定管理管家」"
      >
        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-0 group-hover:opacity-100" />
        
        {isGenerating ? (
          <div className="relative">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <DatabaseZap className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-12' : ''}`} />
            <span className="text-[8px] font-semibold mt-0.5 tracking-wider uppercase opacity-80">全局AI</span>
          </div>
        )}

        {/* Drag handle tooltip anchor */}
        <div className="absolute -top-6 bg-slate-950 text-[9px] text-gray-300 px-1.5 py-0.5 rounded shadow border border-slate-700/50 scale-0 hover:scale-100 group-hover:scale-100 pointer-events-none transition-transform whitespace-nowrap">
          按住拽动 / 双击复位
        </div>
      </button>

      {/* 2. Global AI Slide-Out Glass Drawer (Sidebar Panel Overlaying the Right Edge) */}
      {isOpen && (
        <div 
          id="global-ai-chat-sidebar" 
          className="fixed z-45 bg-[#0f172a]/95 backdrop-blur-md shadow-2xl border border-slate-700/50 rounded-2xl flex flex-col justify-between text-slate-100 overflow-hidden resize animate-fade-in"
          style={{
            top: '12vh',
            left: 'calc(50vw - 225px)',
            width: '450px',
            height: '75vh',
            minWidth: '300px',
            minHeight: '400px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            animation: 'fadeIn 0.2s ease-out forwards',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Sidebar Top Banner Header */}
          <div className="p-4 border-b border-slate-800 bg-[#1e293b]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 px-2 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <DatabaseZap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">全局 AI 物理文案管家</h3>
                <p className="text-[10px] text-slate-400">支持秒级硬盘设定文件检索、读取与一键修改</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChatHistory}
                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="清空聊天缓存记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="折叠面板"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container Area with Custom Tool Displays */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 p-4 overflow-auto space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800/80 scroll-smooth"
          >
            {messages.slice(hiddenUpToIndex).map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const isSystem = msg.role === 'system';
              const toolArgs = parseToolCall(msg.content);

              // Extract text content out of JSON payload block to look beautiful
              let displayContent = msg.content;
              if (displayContent.includes('<args>')) {
                displayContent = displayContent.split('<args>')[0].trim();
              }

              return (
                <div 
                  key={msg.id || index} 
                  className={`flex flex-col gap-1.5 transition-all
                    ${isAssistant ? 'items-start' : isSystem ? 'items-center text-center' : 'items-end'}
                  `}
                >
                  {/* Sender labels */}
                  {!isSystem && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1 px-1">
                      {isAssistant ? (
                        <>
                          <Bot className="w-3 h-3 text-sky-400" />
                          <span>全局 AI 档案专家</span>
                        </>
                      ) : (
                        <>
                          <span>作者指令</span>
                          <User className="w-3 h-3 text-emerald-400" />
                        </>
                      )}
                    </span>
                  )}

                  {/* Message Bubble styling */}
                  <div 
                    className={`max-w-[100%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap text-sm border
                      ${isSystem 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300 rounded-lg text-xs italic px-3.5 py-2.5 w-full bg-slate-950/40 text-left' 
                        : isAssistant 
                          ? 'bg-slate-900 border-slate-800 text-slate-100' 
                          : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/30 text-white rounded-br-none'
                      }
                    `}
                  >
                    {/* Render plain text or Markdown style paragraphs */}
                    <div>{displayContent || (isAssistant ? 'AI 指令指令制定中...' : '')}</div>

                    {/* Integrated Tool Proposal Interface Panel! */}
                    {isAssistant && toolArgs && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-800 flex flex-col gap-2 bg-slate-950/50 p-3 rounded-lg border border-sky-500/25">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                          {toolArgs.action === 'search_library_files' && <FolderSearch className="w-4 h-4" />}
                          {toolArgs.action === 'read_library_file' && <FileText className="w-4 h-4" />}
                          {toolArgs.action === 'edit_library_file' && <FileEdit className="w-4 h-4" />}
                          <span className="uppercase">磁盘接口一键提案</span>
                        </div>

                        {/* Tool execution description details */}
                        <div className="bg-slate-900/80 p-2 rounded text-[11px] text-slate-300 font-mono flex flex-col gap-1 border border-slate-800">
                          <div>
                            <span className="text-slate-500">指令行为: </span>
                            <span className="text-amber-400 italic">
                              {toolArgs.action === 'search_library_files' && '物理文件夹极速搜索'}
                              {toolArgs.action === 'read_library_file' && '特定设定文件深度内容提取'}
                              {toolArgs.action === 'edit_library_file' && `内容${toolArgs.mode === 'overwrite' ? '清空重写' : '换行追加写入'}录入`}
                            </span>
                          </div>

                          {toolArgs.query && (
                            <div>
                              <span className="text-slate-500">检索条件: </span>
                              <span className="text-sky-300">"{toolArgs.query}"</span>
                            </div>
                          )}

                          {toolArgs.filePath && (
                            <div>
                              <span className="text-slate-500">目标物理文件: </span>
                              <span className="text-emerald-400 underline">"{toolArgs.filePath}"</span>
                            </div>
                          )}

                          {toolArgs.content && (
                            <div className="mt-1 pt-1 border-t border-slate-800">
                              <span className="text-slate-500 block">拟写入的设定文本数据:</span>
                              <span className="text-slate-200 block bg-slate-950 p-1.5 rounded border border-slate-800 max-h-16 overflow-y-auto mt-0.5 whitespace-pre-wrap">
                                {toolArgs.content}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Proposal actions checkboxes */}
                        {msg.proposalStatus === 'adopted' ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>该物理磁盘操作已在终端执行就绪并成功生效!</span>
                          </div>
                        ) : msg.proposalStatus === 'declined' ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/40 p-2 rounded">
                            <X className="w-3.5 h-3.5" />
                            <span>作者已撤销/婉拒此提案。</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => executeToolCall(msg.id, msg.content)}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>确认一键执行</span>
                            </button>
                            <button
                              onClick={() => declineProposal(msg.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>婉拒</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[9px] uppercase font-semibold text-slate-500 flex items-center gap-1 px-1">
                  <Bot className="w-3 h-3 text-sky-400" />
                  <span>全局 AI 档案专家</span>
                </span>
                <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-450" />
                  <span>在真机物理核心中检索学习中，并准备对应指令...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Chat Actions Area */}
          <div className="p-3 border-t border-slate-800 bg-[#1e293b]/40">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="按路径搜索、读取或在文件末尾写入设定..."
                disabled={isGenerating}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 text-slate-200"
              />
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-2 bg-red-650 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="强行断开并终止AI联想生成"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    inputVal.trim() 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                      : 'bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
            <p className="text-[9px] text-slate-500 mt-1.5 text-center">
              全局AI能直接理解硬盘 txt 和 md 路径。支持追加/覆盖写入真实文件。
            </p>
          </div>
        </div>
      )}

      {/* Styled animation helper injected dynamically */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </>
  );
};
