import React, { useState, useRef } from 'react';
import { BookPlus, RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { ChapterSidebar } from './components/ChapterSidebar';
import { Editor } from './components/Editor';
import { AIChat } from './components/AIChat';
import { ThemeModal } from './components/ThemeModal';
import { SettingsModal } from './components/SettingsModal';
import { LibraryModal } from './components/LibraryModal';
import { CreateNovelModal } from './components/CreateNovelModal';
import { DirectoryInitModal } from './components/DirectoryInitModal';
import { CharactersView } from './components/CharactersView';
import { NotesView } from './components/NotesView';
import { OutlineView } from './components/OutlineView';
import { MindmapView } from './components/MindmapView';
import { BackgroundView } from './components/BackgroundView';
import { ConceptArtView } from './components/ConceptArtView';
import { GlobalAIWidget } from './components/GlobalAIWidget';
import { TabType, Chapter, ChatMessage, AppTheme, AppSettings, NovelProject, CharacterProfile, InspirationNote, StoryNode, BackgroundSetting, LibrarySchema, ConceptCategory, HistoryLog, ConceptImage } from './types';

export const sortTimelineEvents = (timeline: any[]) => {
  if (!timeline) return [];
  const parseYear = (y: string) => {
    let yearStr = y || '';
    let num = 0;
    if (yearStr.includes('元年')) {
      num = 1;
    } else {
      const digitsMatch = yearStr.match(/(-?\d+)/);
      num = digitsMatch ? parseInt(digitsMatch[1], 10) : 0;
    }
    const prefixMatch = yearStr.match(/^([^\d]+)/);
    const prefix = prefixMatch ? prefixMatch[1].trim() : '';
    return { prefix, num };
  };

  const getEraPriority = (prefix: string) => {
    if (prefix.includes('前') || prefix.includes('旧')) return 1;
    if (prefix.includes('公元')) return 2;
    if (prefix.includes('新')) return 3;
    if (prefix.includes('星元')) return 4;
    if (prefix.includes('纪')) return 5;
    return 10;
  };

  return [...timeline].sort((a, b) => {
    const parsedA = parseYear(a.year || '');
    const parsedB = parseYear(b.year || '');
    const prioA = getEraPriority(parsedA.prefix);
    const prioB = getEraPriority(parsedB.prefix);
    if (prioA !== prioB) return prioA - prioB;
    return parsedA.num - parsedB.num;
  });
};

const INITIAL_CHAPTERS: Chapter[] = [
  { id: '1', title: '新建章节 1', isActive: true, content: '' }
];

const MOCK_MESSAGES: ChatMessage[] = [];

const MOCK_CHARACTERS: CharacterProfile[] = [];

const MOCK_NOTES: InspirationNote[] = [];

const MOCK_STORY_NODES: StoryNode[] = [];

const INITIAL_BACKGROUND: BackgroundSetting = {
  worldRules: '',
  geography: '',
  timeline: []
};

const INITIAL_SCHEMAS: LibrarySchema[] = [];

const INITIAL_CONCEPTS: ConceptCategory[] = [];

export default function App() {
  const [activeTab, setActiveTab ] = useState<TabType>('editor');
  
  // States for manual width & height adjustments (isolated per tab)
  const [sidebarWidth, setSidebarWidth] = useState<Record<TabType, number>>(() => {
    const defaultState: Record<TabType, number> = {
      editor: 260, outline: 260, mindmap: 260, notes: 260, characters: 260, background: 260, concept: 260
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_sidebar_width`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const [sidebarHeight, setSidebarHeight] = useState<Record<TabType, number | undefined>>(() => {
    const defaultState: Record<TabType, number | undefined> = {
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_sidebar_height`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const [mainWidth, setMainWidth] = useState<Record<TabType, number | undefined>>(() => {
    const defaultState: Record<TabType, number | undefined> = {
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_main_width`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const [mainHeight, setMainHeight] = useState<Record<TabType, number | undefined>>(() => {
    const defaultState: Record<TabType, number | undefined> = {
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_main_height`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const [chatWidth, setChatWidth] = useState<Record<TabType, number>>(() => {
    const defaultState: Record<TabType, number> = {
      editor: 320, outline: 320, mindmap: 320, notes: 320, characters: 320, background: 320, concept: 320
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_chat_width`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const [chatHeight, setChatHeight] = useState<Record<TabType, number | undefined>>(() => {
    const defaultState: Record<TabType, number | undefined> = {
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    };
    Object.keys(defaultState).forEach((tab) => {
      const saved = localStorage.getItem(`layout_${tab}_chat_height`);
      if (saved) defaultState[tab as TabType] = parseInt(saved, 10);
    });
    return defaultState;
  });

  const startResizeWidth = (e: React.MouseEvent, type: 'chat' | 'sidebar' | 'main', direction: 'left' | 'right') => {
    e.preventDefault();
    const element = e.currentTarget.parentElement;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const startWidth = rect.width;
    const startX = e.clientX;
    let currentWidth = startWidth;

    element.style.transition = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const actualDelta = direction === 'left' ? -deltaX : deltaX;
      
      const maxW = window.innerWidth * 0.85;
      if (type === 'chat') {
        currentWidth = Math.max(180, Math.min(maxW, startWidth + actualDelta));
      } else if (type === 'sidebar') {
        currentWidth = Math.max(120, Math.min(maxW, startWidth + actualDelta));
      } else if (type === 'main') {
        currentWidth = Math.max(280, Math.min(window.innerWidth * 0.9, startWidth + actualDelta));
      }
      
      element.style.width = `${currentWidth}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      element.style.transition = '';
      
      if (type === 'chat') {
        setChatWidth(prev => ({ ...prev, [activeTab]: currentWidth }));
      } else if (type === 'sidebar') {
        setSidebarWidth(prev => ({ ...prev, [activeTab]: currentWidth }));
      } else if (type === 'main') {
        setMainWidth(prev => ({ ...prev, [activeTab]: currentWidth }));
      }
      
      localStorage.setItem(`layout_${activeTab}_${type}_width`, currentWidth.toString());
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizeHeight = (e: React.MouseEvent, type: 'chat' | 'sidebar' | 'main', direction: 'top' | 'bottom') => {
    e.preventDefault();
    const element = e.currentTarget.parentElement;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    let startHeight = rect.height;
    if (rect.height <= 0 && element.parentElement) {
      startHeight = element.parentElement.getBoundingClientRect().height;
    }
    const startY = e.clientY;
    let currentHeight = startHeight;

    element.style.transition = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const actualDelta = direction === 'top' ? -deltaY : deltaY;
      currentHeight = Math.max(80, Math.min(window.innerHeight * 0.9, startHeight + actualDelta));
      
      element.style.height = `${currentHeight}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      element.style.transition = '';
      
      if (type === 'chat') {
        setChatHeight(prev => ({ ...prev, [activeTab]: currentHeight }));
      } else if (type === 'sidebar') {
        setSidebarHeight(prev => ({ ...prev, [activeTab]: currentHeight }));
      } else if (type === 'main') {
        setMainHeight(prev => ({ ...prev, [activeTab]: currentHeight }));
      }
      
      localStorage.setItem(`layout_${activeTab}_${type}_height`, currentHeight.toString());
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResetTabLayout = () => {
    localStorage.removeItem(`layout_${activeTab}_sidebar_width`);
    localStorage.removeItem(`layout_${activeTab}_sidebar_height`);
    localStorage.removeItem(`layout_${activeTab}_main_width`);
    localStorage.removeItem(`layout_${activeTab}_main_height`);
    localStorage.removeItem(`layout_${activeTab}_chat_width`);
    localStorage.removeItem(`layout_${activeTab}_chat_height`);

    setSidebarWidth(prev => ({ ...prev, [activeTab]: 260 }));
    setSidebarHeight(prev => ({ ...prev, [activeTab]: undefined }));
    setMainWidth(prev => ({ ...prev, [activeTab]: undefined }));
    setMainHeight(prev => ({ ...prev, [activeTab]: undefined }));
    setChatWidth(prev => ({ ...prev, [activeTab]: 320 }));
    setChatHeight(prev => ({ ...prev, [activeTab]: undefined }));
  };

  const resetWidth = (type: 'chat' | 'sidebar' | 'main') => {
    if (type === 'chat') {
      setChatWidth(prev => ({ ...prev, [activeTab]: 320 }));
      localStorage.removeItem(`layout_${activeTab}_chat_width`);
    } else if (type === 'sidebar') {
      setSidebarWidth(prev => ({ ...prev, [activeTab]: 260 }));
      localStorage.removeItem(`layout_${activeTab}_sidebar_width`);
    } else if (type === 'main') {
      setMainWidth(prev => ({ ...prev, [activeTab]: undefined }));
      localStorage.removeItem(`layout_${activeTab}_main_width`);
    }
  };

  const resetHeight = (type: 'chat' | 'sidebar' | 'main') => {
    if (type === 'chat') {
      setChatHeight(prev => ({ ...prev, [activeTab]: undefined }));
      localStorage.removeItem(`layout_${activeTab}_chat_height`);
    } else if (type === 'sidebar') {
      setSidebarHeight(prev => ({ ...prev, [activeTab]: undefined }));
      localStorage.removeItem(`layout_${activeTab}_sidebar_height`);
    } else if (type === 'main') {
      setMainHeight(prev => ({ ...prev, [activeTab]: undefined }));
      localStorage.removeItem(`layout_${activeTab}_main_height`);
    }
  };

  const handleResetLayout = () => {
    const tabs: TabType[] = ['editor', 'outline', 'mindmap', 'notes', 'characters', 'background', 'concept'];
    
    tabs.forEach((tab) => {
      localStorage.removeItem(`layout_${tab}_sidebar_width`);
      localStorage.removeItem(`layout_${tab}_sidebar_height`);
      localStorage.removeItem(`layout_${tab}_main_width`);
      localStorage.removeItem(`layout_${tab}_main_height`);
      localStorage.removeItem(`layout_${tab}_chat_width`);
      localStorage.removeItem(`layout_${tab}_chat_height`);
    });

    setSidebarWidth({
      editor: 260, outline: 260, mindmap: 260, notes: 260, characters: 260, background: 260, concept: 260
    });
    setSidebarHeight({
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    });
    setMainWidth({
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    });
    setMainHeight({
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    });
    setChatWidth({
      editor: 320, outline: 320, mindmap: 320, notes: 320, characters: 320, background: 320, concept: 320
    });
    setChatHeight({
      editor: undefined, outline: undefined, mindmap: undefined, notes: undefined, characters: undefined, background: undefined, concept: undefined
    });
  };

  // State for jumping between outline and mindmap
  const [activeNodeId, setActiveNodeId] = useState<string>('root-1');

  
  // Modals state
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isNewNovelOpen, setIsNewNovelOpen] = useState(false);

  // AI Streaming Generator States
  const [isGenerating, setIsGenerating] = useState(false);
  const [conceptMode, setConceptMode] = useState<'prompt' | 'image'>('image');
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Global App configuration
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('nc_theme');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      backgroundType: 'image',
      backgroundValue: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2946',
      panelOpacity: 0.85,
      blurAmount: 12
    };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultProvs = [
      { id: 'DeepSeek', name: 'DeepSeek', apiUrl: 'https://api.deepseek.com/v1', apiKey: '', customModel: 'deepseek-chat' },
      { id: 'Kimi', name: 'Kimi (Moonshot)', apiUrl: 'https://api.moonshot.cn/v1', apiKey: '', customModel: 'moonshot-v1-8k' },
      { id: 'Qwen', name: 'Qwen (通义千问)', apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '', customModel: 'qwen-turbo' },
      { id: 'Zhipu', name: 'Zhipu (智谱)', apiUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '', customModel: 'glm-4-flash' },
      { id: 'OpenAI', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1', apiKey: '', customModel: 'gpt-4o-mini' }
    ];
    try {
      const saved = localStorage.getItem('nc_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.providers || parsed.providers.length === 0) {
          parsed.providers = defaultProvs;
        }
        return parsed;
      }
    } catch(e) {}
    return {
      aiProvider: 'DeepSeek',
      apiUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      customModel: 'deepseek-chat',
      autoSave: true,
      providers: defaultProvs
    };
  });

  // Project Isolation
  const [projects, setProjects] = useState<NovelProject[]>(() => {
    try {
      const saved = localStorage.getItem('nc_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [{
      id: 'default-1',
      name: '新建项目 1',
      chapters: INITIAL_CHAPTERS,
      messages: MOCK_MESSAGES,
      characters: MOCK_CHARACTERS,
      notes: MOCK_NOTES,
      storyNodes: MOCK_STORY_NODES,
      background: INITIAL_BACKGROUND,
      schemas: INITIAL_SCHEMAS,
      concepts: INITIAL_CONCEPTS
    }];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nc_currentProjectId');
      if (saved) return saved;
    } catch(e) {}
    return 'default-1';
  });

  const [isFirstRunModalOpen, setIsFirstRunModalOpen] = useState(false);

  React.useEffect(() => {
    const checkInitOnLoad = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && !data.initialized) {
          setIsFirstRunModalOpen(true);
        }
      } catch (e) {
        console.error("Failed to check workspace initial configuration:", e);
      }
    };
    checkInitOnLoad();
  }, []);

  const handleConfirmSavePath = async (selectedPath: string) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseDir: selectedPath })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '无法设置此保存路径');
    }

    // Auto-create preset folders and synchronize data structure for active memory projects on setting confirmed path
    if (projects && projects.length > 0) {
      for (const proj of projects) {
        try {
          await fetch('/api/documents/init-novel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelName: proj.name })
          });
          await fetch('/api/project/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: proj })
          });
        } catch (err) {
          console.error("Auto Syncing project failing on config path initialization", proj.name, err);
        }
      }
    }
  };

  // Persist to local storage
  React.useEffect(() => {
    localStorage.setItem('nc_theme', JSON.stringify(theme));
  }, [theme]);

  React.useEffect(() => {
    localStorage.setItem('nc_settings', JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    localStorage.setItem('nc_projects', JSON.stringify(projects));
  }, [projects]);

  React.useEffect(() => {
    localStorage.setItem('nc_currentProjectId', currentProjectId);
    if (projects.length === 0) {
      setIsNewNovelOpen(true);
    }
  }, [currentProjectId, projects.length]);

  // 静默后台检测模型连接状况
  React.useEffect(() => {
    const runConnectionCheck = async () => {
      if (settings.apiUrl && settings.apiKey && settings.customModel) {
        try {
          const response = await fetch('/api/check-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiUrl: settings.apiUrl,
              apiKey: settings.apiKey,
              model: settings.customModel
            })
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setSettings(prev => ({ ...prev, isAiConnected: true }));
          } else {
            setSettings(prev => ({ ...prev, isAiConnected: false }));
          }
        } catch (e) {
          setSettings(prev => ({ ...prev, isAiConnected: false }));
        }
      }
    };
    // Delay slightly to prioritize page render
    const timer = setTimeout(runConnectionCheck, 600);
    return () => clearTimeout(timer);
  }, [settings.apiUrl, settings.apiKey, settings.customModel]);

  const currentProjectIndex = projects.findIndex(p => p.id === currentProjectId);
  const currentProject = projects[currentProjectIndex] || projects[0];

  // Debounced auto-sync to local physical disk directory
  React.useEffect(() => {
    if (!currentProject || !currentProject.name) return;
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/project/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: currentProject })
        });
        console.log(`Auto synced project "${currentProject.name}" to local disk successfully.`);
      } catch (err) {
        console.error("Auto physical sync error:", err);
      }
    }, 2500); // 2.5 seconds tranquility buffer
    return () => clearTimeout(timer);
  }, [currentProject]);

  const updateCurrentProject = (updates: Partial<NovelProject> | ((prev: NovelProject) => Partial<NovelProject>)) => {
    setProjects(prevProjects => {
      const idx = prevProjects.findIndex(p => p.id === currentProjectId);
      if (idx === -1) return prevProjects;
      
      const current = prevProjects[idx];
      const appliedUpdates = typeof updates === 'function' ? updates(current) : updates;
      
      const updatedProjects = [...prevProjects];
      updatedProjects[idx] = { ...current, ...appliedUpdates };
      return updatedProjects;
    });
  };

  const handleCloseProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (currentProjectId === id) {
        setCurrentProjectId(filtered[0]?.id || '');
      }
      return filtered;
    });
  };

  const handleCreateNovel = async (name: string, description?: string) => {
    const newProject: NovelProject = {
      id: Date.now().toString(),
      name,
      chapters: [{ id: '1', title: '第一章', isActive: true, content: '' }],
      messages: [{ id: `msg-${Date.now()}`, role: 'assistant', content: `您好！小说《${name}》已创建成功。${description ? `剧情简介：${description}` : ''} 我们从哪里开始探讨？`, type: 'text', tabContext: 'editor' }],
      characters: [],
      notes: [],
      storyNodes: [],
      background: { worldRules: '', geography: '', timeline: [] },
      schemas: INITIAL_SCHEMAS,
      concepts: INITIAL_CONCEPTS
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    setIsNewNovelOpen(false);

    try {
      // First, create novel structural directories
      await fetch('/api/documents/init-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelName: name })
      });
      // Synchronize novel data block to disk files
      await fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: newProject })
      });
    } catch (e) {
      console.error("Failed to physically initialize novel workspace directories:", e);
    }
  };

  // Get derived current chat context (combine mindmap & outline)
  const currentChatContext = activeTab === 'mindmap' ? 'outline' : activeTab;

  const handleSendMessage = async (content: string) => {
    // Check if the user is simulating an AI message
    const isSimulatedAI = content.startsWith('AI:') || content.startsWith('AI：') || content.toLowerCase().startsWith('assistant:');
    
    if (isSimulatedAI) {
      const actualContent = content.replace(/^(AI:|AI：|assistant:)\s*/i, '');
      const isToolCall = actualContent.includes('<args>');
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: actualContent,
        type: isToolCall ? 'tool_call' : 'text',
        tabContext: currentChatContext
      };
      
      updateCurrentProject(prev => ({
        messages: [...prev.messages, newMessage]
      }));
      return;
    }

    // Add user message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type: 'text',
      tabContext: currentChatContext
    };
    
    updateCurrentProject(prev => ({
      messages: [...prev.messages, newMessage]
    }));

    let assistantMessageId = '';

    try {
      const defaultTabPromptsForChat: Record<string, string> = {
        editor: `你是一位顶级的小说执笔专家与主笔。专注于润色文本、扩写故事、完善情节。请全力配合作者对段落和章回的需求进行高规格文学重写。
请专注于文学技巧、段落节奏、氛围渲染和人物对话的生动描摹。`,
        outline: `你是一位顶尖的悬念及大纲构建师。能基于极少线索规划完美的戏剧弧光、剧情转折、线索伏笔、以及高潮起伏。
提供完整的三幕式大纲设计，对情节节奏给予精准指导。
当用户希望你生成一份新的大纲表，或要求你“把大纲同步落库”、“保存到大纲”时，请务必调用 \`batch_sync_outline\` 工具，将生成的阶段性节点（如：初始、第一幕、高潮等）封装于 \`<args>\` 内以更新系统的物理框架。千万不要使用 markdown 代码块包裹 json，直接输出干净的 json。不要只是文字口头允诺。

示例结构约束：
1. 优先使用简明扼要的文字概括情节。
2. 必须以严格合法的 JSON 对象作为包裹。
例如：
<args>{"action": "batch_sync_outline", "nodes": [{"title": "第一幕", "summary": "故事开始", "content": "主角发现异常"}]}</args>`,
        mindmap: `你是一位思维发散与因果推理大师。帮助作者理清复杂的家族势力、力量体系、阴谋网络、以及线索链。
构建合乎逻辑的分支脉络，梳理错综交织的人物因果。`,
        notes: `你是一位极富想象力的小说脑洞捕手，擅长捕捉那些天马行空、不着边际的碎片灵感，将其淬炼成符合世界设定的瑰丽创意。
自动评估灵感质量，生成启发式的创意思维拓展。
当你需要将提炼后的灵感总结并保存到笔记中时，请务必使用以下工具标签输出灵感内容：
<args>{"action": "add_note", "content": "提炼的具体灵感内容", "color": "bg-yellow-50"}</args>
颜色可选值：bg-yellow-50, bg-blue-50, bg-purple-50, bg-green-50, bg-pink-50。`,
        characters: `你是一位大师级的人物侧写师，擅长塑造血肉丰满、灵魂真实的小说人物。设计多维度的冲突根源、语言特质和外貌伏笔。
分析性格对剧情的驱动力，使每个配角都有独特的动机。`,
        background: `你是一位世界构建专家（Wordbuilder）。专注于建立宏大、严谨的物理法则、地理关系和历史编年史。
当用户要增改世界观时，请配合输出微缩工具标签 <args>...</args> 以便他们一键将你的规划和设定自动写入数据库中。`,
        concept: `你是一位卓越的科幻魔幻概念画师和美学大师。擅长为小说的各种神话道具、地理景观、装甲服饰提炼极精确、极写意的画面 Prompt 指令。
生成极有质感的概念设计词，方便一键进行高品质插画或概念草图生成。`
      };

      const currentTabModel = settings.tabSettings?.[activeTab]?.model || settings.customModel;
      const currentTabPrompt = settings.tabSettings?.[activeTab]?.systemPrompt || defaultTabPromptsForChat[activeTab];

      assistantMessageId = (Date.now() + 1).toString();

      // Append an empty placeholder assistant message first
      updateCurrentProject(prev => ({
        messages: [...prev.messages, {
          id: assistantMessageId,
          role: 'assistant',
          content: '正在联想设定中...',
          type: 'text',
          tabContext: currentChatContext
        }]
      }));

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      setIsGenerating(true);

      // 真实请求本地 MCP Server (Server 负责代理到 Gemini 或用户自定义模型)
      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentTabMessages.concat(newMessage).map(m => ({ role: m.role, text: m.content })),
          context: currentContextLabels.join(', '),
          background: currentProject.background, // 注入当前背景数据库，进行更严密的前后逻辑联想集成与改写
          storyNodes: currentProject.storyNodes, // 注入大纲和思维导图节点状态
          chapters: currentProject.chapters, // 注入章节列表状态
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
          model: currentTabModel,
          systemPrompt: currentTabPrompt,
          novelName: currentProject?.name || ''
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || '网络通信异常');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamContent = '';

      if (reader) {
        let isDone = false;
        let sseBuffer = '';
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
                  
                  // Update the placeholder message progressive contents in state
                  updateCurrentProject(prev => {
                    const isToolCall = streamContent.includes('<tool_call>') || streamContent.includes('<args>');
                    return {
                      ...prev,
                      messages: prev.messages.map(m => {
                        if (m.id === assistantMessageId) {
                          return {
                            ...m,
                            content: streamContent,
                            type: isToolCall ? 'tool_call' as const : 'text' as const
                          };
                        }
                        return m;
                      })
                    };
                  });
                }
              } catch (e) {
                // Ignore parsing errors for incomplete SSE packages
              }
            }
          }
        }
      }
      
      // If the stream finished but absolutely no content was received
      if (!streamContent) {
        updateCurrentProject(prev => ({
          ...prev,
          messages: prev.messages.map(m => {
            if (m.id === assistantMessageId && m.content === '正在联想设定中...') {
              return {
                ...m,
                content: '⚠️ 无法从模型或网络代理获取有效回复，可能是请求被拦截或模型本身故障未返回任何信息。',
                type: 'text'
              };
            }
            return m;
          })
        }));
      }

      setIsGenerating(false);
      activeAbortControllerRef.current = null;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("AI stream aborted by author signal");
        setIsGenerating(false);
        activeAbortControllerRef.current = null;
        updateCurrentProject(prev => ({
          ...prev,
          messages: prev.messages.map(m => {
            if (m.id === assistantMessageId) {
              return {
                ...m,
                content: '🔄 [已落锁中断] 作者已中断此灵感联想，对话截流落锁。'
              };
            }
            return m;
          })
        }));
        return;
      }
      setIsGenerating(false);
      activeAbortControllerRef.current = null;
      console.warn("Backend chat failed, falling back to mock logic.", err);
      // Fallback
      setTimeout(() => {
        let aiResponseContent = `❌ 无法连接到模型或请求失败：\n\n\`\`\`json\n${err.message || 'Error'}\n\`\`\`\n\n> （提示：您可以检查在左侧设置中的 API 密钥和代理地址。由于无法接收到模型的回答，暂时无法继续正常探讨。）`;
        let aiResponseType: ChatMessage['type'] = 'text';

        // High-sensitivity world building detectors
        const isWorldRuleMod = /(修改|设定|设立|增加|更新|删除|废除|更改)(核心)?(法则|规则|物理定律|常数|世界观|设守则)/.test(content) || content.includes('核心法则') || content.includes('世界规则');
        const isGeographyMod = /(修改|设定|更新|增加|地理|疆界|疆域|城市|城邦|遗迹|地图|地势|大陆)/.test(content) && (content.includes('地理') || content.includes('地图') || content.includes('城邦') || content.includes('遗迹') || content.includes('城市') || content.includes('大陆') || content.includes('疆域'));
        const isTimelineAddOrMod = /(添加|新增|加入|记录|修改|编撰|删除|删掉|剔除|抹弃|抹去|清除|废除|撤销|清理)(纪事|历史|事件|编年史|记录|信息|时刻|时代)|[(\d+年|星元\d+年|新历\d+年|公元\d+年|旧历\d+年|星元元年|元年)]/.test(content);

        if (isWorldRuleMod) {
          const cleanRule = content.replace(/^(修改|设定|设立|增加|更新|删除|废除|更改)?(核心)?(法则|规则|物理定律|常数|世界观|设守则|：|:|\s)+/, '').trim();
          const baseRules = currentProject?.background?.worldRules || '';
          
          // AI 极致联想改写文字，采用高度史诗、学术或高水准风格
          const polishedRule = `「超维意志修正」：世界基本运转律令增加关于【${cleanRule}】的衍生修正条令。该界域常数改写，成了不可动摇的黄金常律。`;
          const newWorldRules = baseRules ? `${baseRules}\n\n- ${polishedRule}` : `- ${polishedRule}`;
          
          aiResponseContent = `已为您识别到核心世界法则及约束设定的更新意图：
          
> "${cleanRule}"

我已经将该更新与您当前的【物理法则设定与阶级分布】内容进行了深度联想，重现了合乎其世界底色氛围的大气描述：

> **经过 AI 联想改写后的世界观守则文字**：
> "${polishedRule}"

我已经为您起草了这一世界守则更新提案。点击下面按钮可一键注入【核心法则约束】本底中：
<args>{"action": "update_world_rules", "worldRules": ${JSON.stringify(newWorldRules)}}</args>`;
          aiResponseType = 'tool_call';
        } else if (isGeographyMod) {
          const cleanGeo = content.replace(/^(修改|设定|更新|增加|地理|疆界|疆域|城市|城邦|遗迹|地图|地势|大陆|：|:|\s)+/, '').trim();
          const baseGeo = currentProject?.background?.geography || '';
          
          // 极致风气地理词条
          const polishedGeo = `【古卷舆图残页】原大荒核心边缘受到磁暴洗涤，新生了地理构造：${cleanGeo}。此处终年弥漫着游离的法则颗粒，已被载入常行者的绝地舆图中。`;
          const newGeography = baseGeo ? `${baseGeo}\n\n- ${polishedGeo}` : `- ${polishedGeo}`;

          aiResponseContent = `已为您识别到地理、城邦与遗迹地貌的增改意图：
          
> "${cleanGeo}"

在核查您已有的【城邦、地理与遗迹坐标】后，为满足前后文时有时空感张力，我已为您修饰和改写了这一新大陆板块描述：

> **经过 AI 联想改写后的地理描述文字**：
> "${polishedGeo}"

是否确认通过本地大舆图融入机制将该描述无缝更新入库？
<args>{"action": "update_geography", "geography": ${JSON.stringify(newGeography)}}</args>`;
          aiResponseType = 'tool_call';
        } else if (isTimelineAddOrMod) {
          let extractedYear = '';
          let extractedEvent = '';
          const yearMatch = content.match(/(\d+年|星元\d+年|新历\d+年|公元\d+年|旧历\d+年|星元元年|元年)/);
          
          if (yearMatch) {
            extractedYear = yearMatch[1];
            extractedEvent = content.replace(extractedYear, '').replace(/^(在新历|在|于|发生了|发生|新增|添加|记录|修改|编撰|删除|剔除|对|做出修改|：|:|\s)+/, '').trim();
          } else {
            extractedYear = '新历某年';
            extractedEvent = content.replace(/^(添加|新增|加入|记录|修改|编撰|删除|剔除|对|做出修改)?(纪事|历史|事件|编年史|：|:|\s)+/, '').trim();
          }

          // 核心联想：对星元25年做出修改，那一年什么都没有发送
          const existingEvent = currentProject?.background?.timeline?.find((item: any) => item.year.includes(extractedYear));
          const isDeletion = /(删除|删掉|剔除|抹弃|抹去|清除|废除)/.test(content);

          let polishedEvent = '';
          if (extractedEvent.includes('什么都没有发生') || extractedEvent.includes('什么都没发生') || extractedEvent.includes('什么都没有发送')) {
             polishedEvent = `星轨静穆，万灵俱灭。此时代处于极度法则真空，由于未知高维波频抹杀，沦为了大废墟编年史上令人忌惮的“湮灭空白期”。`;
          } else {
             polishedEvent = `史诗回响在此定格。那年，尘封在大气下层的黑金宿命被猛然开启：「${extractedEvent}」。联邦的轮毂自此发生宿命扭转。`;
          }

          const isAfterOrBeforeDeletion = isDeletion && /(之后|以后|后面|之前|以前|前面)/.test(content);

          if (isAfterOrBeforeDeletion) {
            const isAfter = /(之后|以后|后面)/.test(content);
            const isBefore = /(之前|以前|前面)/.test(content);
            let baseYearStr = extractedYear;
            if (content.includes('元年')) {
              const eraMatch = content.match(/([^\s\d\w\p{P}]+)?元年/u);
              if (eraMatch) {
                baseYearStr = eraMatch[0];
              }
            }

            const parseYearLocal = (y: string) => {
              let yearStr = y || '';
              let num = 0;
              if (yearStr.includes('元年')) {
                num = 1;
              } else {
                const digitsMatch = yearStr.match(/(-?\d+)/);
                num = digitsMatch ? parseInt(digitsMatch[1], 10) : 1;
              }
              const prefixMatch = yearStr.match(/^([^\d\s]+)/);
              const prefix = prefixMatch ? prefixMatch[1].replace(/元年$/, '').trim() : '';
              return { prefix, num };
            };

            const getEraPriorityLocal = (prefix: string) => {
              if (prefix.includes('前') || prefix.includes('旧')) return 1;
              if (prefix.includes('公元')) return 2;
              if (prefix.includes('新')) return 3;
              if (prefix.includes('星元')) return 4;
              if (prefix.includes('纪')) return 5;
              return 10;
            };

            const parsedBase = parseYearLocal(baseYearStr);
            const basePriority = getEraPriorityLocal(parsedBase.prefix);

            const checkCondition = (y: string) => {
              const p = parseYearLocal(y);
              const prio = getEraPriorityLocal(p.prefix);
              if (isAfter) {
                if (prio !== basePriority) {
                  return prio > basePriority;
                }
                return p.num > parsedBase.num;
              } else if (isBefore) {
                if (prio !== basePriority) {
                  return prio < basePriority;
                }
                return p.num < parsedBase.num;
              }
              return false;
            };

            const survivalEvents = currentProject?.background?.timeline?.filter((item: any) => {
              return !checkCondition(item.year);
            }) || [];

            aiResponseContent = `已识别到您要批量剔除特定编年时刻 **${baseYearStr}** ${isAfter ? '之后' : '之前'}所有历史纪事的意图：

- **基准时刻**：${baseYearStr}
- **筛选后保留的纪事数量**：${survivalEvents.length} 个（其余已被一并剔除）

为了确保编年纪事的连贯与顺序，我已为您重新编撰了保留的黄金编年史分支。点击下方按钮确认通过本地重整覆盖：
<args>{"action": "update_timeline", "timeline": ${JSON.stringify(survivalEvents)}}</args>`;
          } else if (isDeletion) {
            const existingEventForDelete = currentProject?.background?.timeline?.find((item: any) => item.year.includes(extractedYear) || (extractedEvent && item.event.includes(extractedEvent)));
            if (existingEventForDelete) {
              aiResponseContent = `已捕获您对历史编年事件的删除剔除意图：
              
- **指定年份**：${existingEventForDelete.year}
- **大事内容**：${existingEventForDelete.event}

我已经为您构建了剔除提案（该节点将会归于寂灭）。点击下方按钮确认通过本地工具一键剔除：
<args>{"action": "delete_timeline_event", "id": "${existingEventForDelete.id}", "yearQuery": "${existingEventForDelete.year}"}</args>`;
            } else {
              aiResponseContent = `已识别剔除编年史意图，但在当前记录中未能够匹配到关于 ${extractedYear || extractedEvent} 的纪事，请尝试输入具体年份（如“星元25年”）或原事件关键词以供删除。`;
            }
          } else if (existingEvent) {
            aiResponseContent = `已捕获您对特定纪元年份 **${extractedYear}** 的修改请求（原记录为：“${existingEvent.event}”）。
            
基于您的新诉求，我与大历史背景进行深度融合联想，以史诗风格重撰了该年的历史折断点：

> **修改后的纪元史条目**：
> **[${extractedYear}]**：${polishedEvent}

我已为您起草了这一大事记变更覆盖协议。请确认是否一键替换至【纪事编年表】中？
<args>{"action": "modify_timeline_event", "id": "${existingEvent.id}", "year": "${extractedYear}", "event": ${JSON.stringify(polishedEvent)}}</args>`;
          } else {
            aiResponseContent = `已捕获您对纪元史新增大事件的意图：
            
- **预设年份**：${extractedYear}
- **基础轮廓**：${extractedEvent || '新增编年大事件'}

我针对您的诉求进行了史实风格化联想改写，为您重撰大事纪条目如下：

> **经过 AI 联想改写后的大事纪文字**：
> **[${extractedYear}]**：${polishedEvent}

是否现在通过大历史纪事模块，将此一笔写入最新的编年表主干？
<args>{"action": "add_timeline_events", "events": [{"year": "${extractedYear}", "event": ${JSON.stringify(polishedEvent)}}]}</args>`;
          }
          aiResponseType = 'tool_call';
        } else if ((activeTab === 'outline' || activeTab === 'mindmap') && (content.includes('增加') || content.includes('情节'))) {
          aiResponseContent = `根据您的要求，我构思了一个分支情节...\n\`\`\`json\n{"nodes": []}\n\`\`\``;
          aiResponseType = 'outline_proposal';
        } else if ((content.includes('角色') || content.includes('头像')) && activeTab === 'characters') {
          const intendedPrompt = content;
          aiResponseContent = `准备为您生成角色头像。请确认。\n<args>{"action": "generate_character_avatar", "characterId": "${currentProject.characters?.[0]?.id || ''}", "prompt": "${intendedPrompt}"}</args>`;
          aiResponseType = 'tool_call';
        } else if (content.includes('图') || content.includes('画') || activeTab === 'concept') {
          const intendedPrompt = content.replace(/生成|画张|图/g, '').trim();
          aiResponseContent = `准备为您生成概念设计图（提示词：${intendedPrompt}）。请确认。\n<args>{"action": "generate_concept_image", "categoryId": "${currentProject.concepts?.[0]?.id || 'cat-1'}", "prompt": "${intendedPrompt}"}</args>`;
          aiResponseType = 'tool_call';
        }

        updateCurrentProject(prev => {
          const cleanMessages = prev.messages.filter(m => m.id !== assistantMessageId);
          return {
            ...prev,
            messages: [...cleanMessages, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: aiResponseContent,
              type: aiResponseType,
              tabContext: currentChatContext
            }]
          };
        });
      }, 1200);
    }
  };

  const logDiaryEntryOnServer = async (logEntry: any) => {
    try {
      await fetch('/api/diary/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logEntry })
      });
    } catch (e) {
      console.error("Failed to sync log to server diary:", e);
    }
  };

  const handleAdoptProposal = async (type: string, content: string, messageId?: string) => {
    if (type === 'rollback_last') {
      // Physically rollback the last diary log item from the server backend
      try {
        await fetch('/api/diary/undo', { method: 'POST' });
      } catch (err) {
        console.error("Failed to synchronize rollback command to server diary log:", err);
      }

      updateCurrentProject(prev => {
        const logs = prev.background.historyLogs || [];
        if (logs.length === 0) return prev;
        const lastLog = logs[0]; // 最新的在前

        if ((lastLog.actionType as string) === 'chapter_content_update') {
          return {
            ...prev,
            chapters: prev.chapters.map(c => c.id === lastLog.preState.chapterId ? { ...c, content: lastLog.preState.content } : c),
            background: {
              ...prev.background,
              historyLogs: logs.filter(l => l.id !== lastLog.id)
            },
            messages: prev.messages.filter(m => m.id !== content).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `🔄 已撤回：正文章节段落改写已被成功撤销并复原。`,
              type: 'text',
              tabContext: 'editor'
            })
          };
        }

        if ((lastLog.actionType as string) === 'outline_update' && lastLog.preState && lastLog.preState.storyNodes) {
          return {
            ...prev,
            storyNodes: lastLog.preState.storyNodes,
            background: {
              ...prev.background,
              historyLogs: logs.filter(l => l.id !== lastLog.id)
            },
            messages: prev.messages.filter(m => m.id !== content).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `🔄 已撤回：大纲及脑图节点结构已被成功撤销并复原。`,
              type: 'text',
              tabContext: 'outline'
            })
          };
        }

        return {
          ...prev,
          background: {
            ...prev.background,
            ...lastLog.preState,
            historyLogs: logs.filter(l => l.id !== lastLog.id)
          },
          messages: prev.messages.filter(m => m.id !== content).concat({
            id: Date.now().toString(),
            role: 'system',
            content: `🔄 已撤回：已成功撤消【${lastLog.description}】并追溯重做。`,
            type: 'text',
            tabContext: 'background'
          })
        };
      });

      const logs = currentProject?.background.historyLogs || [];
      const lastLog = logs[0];
      if (lastLog && (lastLog.actionType as string) === 'chapter_content_update') {
        setActiveTab('editor');
      } else if (lastLog && (lastLog.actionType as string) === 'outline_update') {
        setActiveTab('outline');
      } else {
        setActiveTab('background');
      }
    } else if (type === 'decline_proposal') {
      const targetMessageId = messageId || content;
      updateCurrentProject(prev => ({
        messages: prev.messages.map(m => m.id === targetMessageId ? { ...m, proposalStatus: 'declined' as const } : m).concat({
          id: Date.now().toString(),
          role: 'system',
          content: '❌ 已取消外部或本地设定世界更迭方案。',
          type: 'text',
          tabContext: currentChatContext
        })
      }));
    } else if (type === 'outline') {
      import('./lib/parser').then(({ parseStoryNodes }) => {
        const result = parseStoryNodes(content);
        if (result.success && result.data) {
          updateCurrentProject(prev => ({
            storyNodes: [...prev.storyNodes, ...result.data!],
            messages: [...prev.messages, {
              id: Date.now().toString(),
              role: 'system',
              content: '✅ 成功提取 JSON 并将节点无缝融入大纲拓扑图。',
              type: 'text',
              tabContext: currentChatContext
            }]
          }));
        } else {
          alert('解析失败：' + result.error);
        }
      });
    } else if (type === 'tool_call') {
      try {
        // Mark the calling message block as adopted to prevent duplicate clicks and confusion
        const targetMessageId = messageId;
        updateCurrentProject(prev => ({
          ...prev,
          messages: prev.messages.map(m => {
            if (targetMessageId && m.id === targetMessageId) {
              return { ...m, proposalStatus: 'adopted' as const };
            }
            if (!targetMessageId && m.content === content) {
              return { ...m, proposalStatus: 'adopted' as const };
            }
            return m;
          })
        }));

        // extract tool args from content
        const argsMatch = content.match(/<args>([\s\S]*?)<\/args>/);
        let argsStr = argsMatch ? argsMatch[1] : '{}';
        
        // Strip markdown code block if hallucinated by AI
        argsStr = argsStr.replace(/^\s*```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();

        const args = JSON.parse(argsStr);

        // Notify user we are starting the tool
        const pendingMsgId = Date.now().toString();
        updateCurrentProject(prev => ({
          messages: [...prev.messages, {
            id: pendingMsgId,
            role: 'system',
            content: '⏳ 正在调用本地工具模块执行操作...',
            type: 'text',
            tabContext: currentChatContext
          }]
        }));

        if (args.action === 'batch_sync_outline') {
          updateCurrentProject(prev => {
            const rootParentId = args.parentId || null;
            const newNodes = (args.nodes || []).map((n: any, idx: number) => ({
              id: `node-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
              title: n.title || '新增大纲节点',
              summary: n.summary || '',
              content: n.content || '',
              parentId: rootParentId,
              timeLabel: n.timeLabel || n.time || '',
              nodeType: rootParentId ? 'branch' : 'main'
            }));

            const newLog: HistoryLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'outline_update',
              description: `AI 批量编排架构并更新了 ${newNodes.length} 个情节大纲节点`,
              preState: { storyNodes: prev.storyNodes },
              postState: { storyNodes: [...prev.storyNodes, ...newNodes] }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              storyNodes: [...prev.storyNodes, ...newNodes],
              background: {
                ...prev.background,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ ${newNodes.length}个大纲节点已成功结构化并保存到「大纲时间线」当中！请在左侧主视口内查阅。`,
                type: 'text',
                tabContext: currentChatContext
              })
            };
          });
          setActiveTab('outline');
        } else if (args.action === 'add_timeline_events') {
          const eventsWithIds = args.events.map((e: any) => ({ ...e, id: `tl-${Date.now()}-${Math.random()}` }));
          
          updateCurrentProject(prev => {
            const oldTimeline = [...prev.background.timeline];
            const sortedNewTimeline = sortTimelineEvents([...oldTimeline, ...eventsWithIds]);
            
            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'timeline_add' as const,
              description: `AI 联想并注入大事记: [${args.events.map((ev: any) => ev.year).join(', ')}]`,
              preState: { timeline: oldTimeline },
              postState: { timeline: sortedNewTimeline }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                timeline: sortedNewTimeline,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 纪事编年事件已成功融入并保存。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'update_world_rules') {
          updateCurrentProject(prev => {
            const oldRules = prev.background.worldRules || '';
            
            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'world_rules_update' as const,
              description: `AI 优化核心世界法律约束设定`,
              preState: { worldRules: oldRules },
              postState: { worldRules: args.worldRules }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                worldRules: args.worldRules,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 世界核心法理与设定守则已一键生效并保存。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'update_geography') {
          updateCurrentProject(prev => {
            const oldGeo = prev.background.geography || '';
            
            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'geography_update' as const,
              description: `AI 联想重塑疆界与遗迹舆图`,
              preState: { geography: oldGeo },
              postState: { geography: args.geography }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                geography: args.geography,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 地理舆图设定与疆界描述已更新入库并保存。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'modify_timeline_event') {
          updateCurrentProject(prev => {
            const oldTimeline = [...prev.background.timeline];
            const updatedTimeline = prev.background.timeline.map((item: any) => {
              const matchesId = args.id && item.id === args.id;
              const matchesYear = args.yearQuery && item.year.includes(args.yearQuery);
              if (matchesId || matchesYear) {
                return {
                  ...item,
                  year: args.year !== undefined ? args.year : item.year,
                  event: args.event !== undefined ? args.event : item.event
                };
              }
              return item;
            });

            const sortedTimeline = sortTimelineEvents(updatedTimeline);
            const updatedItem = prev.background.timeline.find((item: any) => (args.id && item.id === args.id) || (args.yearQuery && item.year.includes(args.yearQuery)));

            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'timeline_modify' as const,
              description: `AI 调整修改大事纪事: [${updatedItem?.year || args.year || ''}]`,
              preState: { timeline: oldTimeline },
              postState: { timeline: sortedTimeline }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                timeline: sortedTimeline,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 纪事编年表项已完成更新修改。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'delete_timeline_event') {
          updateCurrentProject(prev => {
            const oldTimeline = [...prev.background.timeline];
            const updatedTimeline = prev.background.timeline.filter((item: any) => {
              const matchesId = args.id && item.id === args.id;
              const matchesYear = args.yearQuery && item.year.includes(args.yearQuery);
              return !(matchesId || matchesYear);
            });

            const deletedItem = prev.background.timeline.find((item: any) => (args.id && item.id === args.id) || (args.yearQuery && item.year.includes(args.yearQuery)));

            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'timeline_delete' as const,
              description: `AI 剔除删除大事记纪事: [${deletedItem?.year || args.yearQuery || ''}]`,
              preState: { timeline: oldTimeline },
              postState: { timeline: updatedTimeline }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                timeline: updatedTimeline,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 纪事编年事件已成功剔除。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'update_timeline') {
          updateCurrentProject(prev => {
            const oldTimeline = [...prev.background.timeline];
            const sortedTimeline = sortTimelineEvents(args.timeline || []);
            
            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'timeline_delete' as const,
              description: `AI 批量剔除并重整历史纪事编年表`,
              preState: { timeline: oldTimeline },
              postState: { timeline: sortedTimeline }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              background: {
                ...prev.background,
                timeline: sortedTimeline,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 纪事编年表已全局覆盖、按设定顺序重整完毕。',
                type: 'text',
                tabContext: 'background'
              })
            };
          });
          setActiveTab('background');
        } else if (args.action === 'add_concept_category') {
          const catId = `cat-${Date.now()}`;
          updateCurrentProject(prev => ({
            concepts: [...(prev.concepts || []), {
              id: catId,
              name: args.name || '新概念图分类',
              description: args.description || '',
              images: []
            }],
            messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `✅ AI 已自动创建并分类录入概念设计主题: 【${args.name || '新概念'}】。`,
              type: 'text',
              tabContext: 'concept'
            })
          }));
          setActiveTab('concept');
        } else if (args.action === 'add_concept_image') {
          const targetCatId = args.categoryId || currentProject.concepts?.[0]?.id || `cat-${Date.now()}`;
          const newImg = {
            id: `img-${Date.now()}`,
            url: args.url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60',
            prompt: args.prompt || args.description || '自动分类录入图',
            createdAt: new Date().toISOString()
          };
          updateCurrentProject(prev => {
            const catExists = (prev.concepts || []).some(c => c.id === targetCatId);
            let updatedConcepts = prev.concepts || [];
            if (!catExists) {
              updatedConcepts = [...updatedConcepts, { id: targetCatId, name: 'AI自动录入分类', description: '高纬度AI分类索引项', images: [newImg] }];
            } else {
              updatedConcepts = updatedConcepts.map(c => c.id === targetCatId ? { ...c, images: [...c.images, newImg] } : c);
            }
            return {
              ...prev,
              concepts: updatedConcepts,
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ AI 已成功将相应插画分类录入到概念设计库中。`,
                type: 'text',
                tabContext: 'concept'
              })
            };
          });
          setActiveTab('concept');
        } else if (args.action === 'sync_image_to_character') {
          const targetCharId = args.characterId || currentProject.characters?.[0]?.id;
          if (!targetCharId) {
            throw new Error('未能在项目中找到该角色的档案，请确认角色名。');
          }
          const imageUrl = args.imageUrl;
          if (!imageUrl) {
            throw new Error('缺失同步图片的链接地址');
          }
          handleUpdateCharacter(targetCharId, { avatar: imageUrl });
          updateCurrentProject(prev => {
            const charName = prev.characters?.find(c => c.id === targetCharId)?.name || '目标角色';
            return {
              ...prev,
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 已成功同步关联该概念图片作为 【${charName}】 的设定头像！`,
                type: 'text',
                tabContext: 'characters'
              })
            };
          });
          setActiveTab('characters');
        } else if (args.action === 'replace_chapter_text') {
          updateCurrentProject(prev => {
            const targetCh = prev.chapters.find(c => c.id === args.chapterId);
            if (!targetCh) {
              throw new Error(`未能在当前小说中找到对应的章节：ID ${args.chapterId || '未知'}`);
            }
            
            const oldContent = targetCh.content || '';
            let newContent = '';
            
            const start = args.start;
            const end = args.end;
            const oldText = args.oldText || '';
            const newText = args.newText || '';
            
            const idx = oldContent.indexOf(oldText);
            
            if (start !== undefined && end !== undefined && oldContent.substring(start, end) === oldText) {
              newContent = oldContent.substring(0, start) + newText + oldContent.substring(end);
            } else if (idx !== -1) {
              newContent = oldContent.substring(0, idx) + newText + oldContent.substring(idx + oldText.length);
            } else {
              newContent = oldContent.replace(oldText, newText);
            }

            const newLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'chapter_content_update' as const,
              description: `重写润色正文章节【${targetCh.title}】的段落`,
              preState: { chapterId: args.chapterId, content: oldContent },
              postState: { chapterId: args.chapterId, content: newContent }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              chapters: prev.chapters.map(c => c.id === args.chapterId ? { ...c, content: newContent } : c),
              background: {
                ...prev.background,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 正文章节【${targetCh.title}】的文字重润修改已完美执行！\n可随时点击上方 “撤回” 追溯历史状态！`,
                type: 'text',
                tabContext: 'editor'
              })
            };
          });
          setActiveTab('editor');
        } else if (args.action === 'create_story_node') {
          updateCurrentProject(prev => {
            const newNode = {
              id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: args.title || '拟定新和声/大细纲节点',
              summary: args.summary || '',
              content: args.content || '',
              parentId: args.parentId || null,
              nodeType: args.parentId ? 'branch' as const : 'main' as const
            };

            const newLog: HistoryLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'outline_update',
              description: `大纲新增剧情节点: 【${newNode.title}】`,
              preState: { storyNodes: [...prev.storyNodes] },
              postState: { storyNodes: [...prev.storyNodes, newNode] }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              storyNodes: [...prev.storyNodes, newNode],
              background: {
                ...prev.background,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 创意大纲节点【${newNode.title}】已成功融入思维大纲与脑图拓扑！可通过上方 “撤回” 扭转时空！`,
                type: 'text',
                tabContext: 'outline'
              })
            };
          });
          setActiveTab('outline');
        } else if (args.action === 'update_story_node') {
          updateCurrentProject(prev => {
            const targetNode = prev.storyNodes.find(n => n.id === args.nodeId);
            if (!targetNode) {
              throw new Error(`未能在当前作品大纲中找到 ID 为 ${args.nodeId} 的情节节点`);
            }

            const oldStoryNodes = [...prev.storyNodes];
            const updatedStoryNodes = prev.storyNodes.map(n => {
              if (n.id === args.nodeId) {
                return {
                  ...n,
                  title: args.title !== undefined ? args.title : n.title,
                  summary: args.summary !== undefined ? args.summary : n.summary,
                  content: args.content !== undefined ? args.content : n.content
                };
              }
              return n;
            });

            const newLog: HistoryLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'outline_update',
              description: `大纲修订剧情节点: 【${targetNode.title}】`,
              preState: { storyNodes: oldStoryNodes },
              postState: { storyNodes: updatedStoryNodes }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              storyNodes: updatedStoryNodes,
              background: {
                ...prev.background,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 剧情大纲卡牌【${args.title || targetNode.title}】细项修改已成功同步大纲与脑图！可随时一键 “撤回”！`,
                type: 'text',
                tabContext: 'outline'
              })
            };
          });
          setActiveTab('outline');
        } else if (args.action === 'delete_story_node') {
          updateCurrentProject(prev => {
            const targetNode = prev.storyNodes.find(n => n.id === args.nodeId);
            if (!targetNode) {
              throw new Error(`未能在大纲树中定位到需要删除的节点 ID 为 ${args.nodeId}`);
            }

            const oldStoryNodes = [...prev.storyNodes];
            const updatedStoryNodes = prev.storyNodes.filter(n => n.id !== args.nodeId);

            const newLog: HistoryLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              actionType: 'outline_update',
              description: `大纲废弃情节节点: 【${targetNode.title}】`,
              preState: { storyNodes: oldStoryNodes },
              postState: { storyNodes: updatedStoryNodes }
            };

            logDiaryEntryOnServer(newLog);

            return {
              ...prev,
              storyNodes: updatedStoryNodes,
              background: {
                ...prev.background,
                historyLogs: [newLog, ...(prev.background.historyLogs || [])]
              },
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 已成功移去大纲及思维脑图卡片【${targetNode.title}】。可以通过 “撤回” 键瞬间闪回找回！`,
                type: 'text',
                tabContext: 'outline'
              })
            };
          });
          setActiveTab('outline');
        } else if (args.action === 'generate_concept_image' || args.action === 'generate_character_avatar') {
          // Call local server
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: args.prompt })
          });

          if (!response.ok) {
            throw new Error('API Key missing or Generation Failed');
          }

          const data = await response.json();
          
          if (args.action === 'generate_character_avatar' && args.characterId) {
             handleUpdateCharacter(args.characterId, { avatar: data.image });
             setActiveTab('characters');
             
            updateCurrentProject(prev => ({
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: '✅ 角色头像生成完毕，已更新档案。',
                type: 'text',
                tabContext: 'characters'
              })
            }));
          } else {
             const newImage = {
               id: `img-${Date.now()}`,
               url: data.image,
               prompt: args.prompt,
               createdAt: new Date().toISOString()
             };
          
             handleAddConceptImage(args.categoryId, newImage);
             setActiveTab('concept');

             updateCurrentProject(prev => ({
               messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                 id: Date.now().toString(),
                 role: 'system',
                 content: '✅ 图片生成完毕，已自动入库到概念设计图中。',
                 type: 'text',
                 tabContext: 'concept'
               })
             }));
          }
        } else if (args.action === 'create_concept_category') {
          handleAddConceptCategory(args.name);
          setActiveTab('concept');
          updateCurrentProject(prev => ({
            messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `✅ 已成功为您在概念设计图中创建了分类文件夹【${args.name}】！可在分类文件夹和本地磁盘库文件中查看。`,
              type: 'text',
              tabContext: 'concept'
            })
          }));
        } else if (args.action === 'save_concept_image') {
          let targetCatId = args.categoryId;
          if (!targetCatId) {
            const defaultCat = currentProject.concepts?.[0];
            if (defaultCat) {
              targetCatId = defaultCat.id;
            } else {
              targetCatId = `cat-${Date.now()}`;
              handleAddConceptCategory('默认收集箱', targetCatId);
            }
          }
          const newImage = {
            id: `img-${Date.now()}`,
            url: args.url,
            prompt: args.prompt,
            createdAt: new Date().toISOString()
          };
          handleAddConceptImage(targetCatId, newImage);
          setActiveTab('concept');
          updateCurrentProject(prev => ({
            messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `✅ 已成功将图片录入保存。已自动归类到设定册【插图合集】中，并在本地持久化保存。`,
              type: 'text',
              tabContext: 'concept'
            })
          }));
        } else if (args.action === 'search_library_files') {
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
          if (data.success && data.tree) {
            const matched = findFilesRec(data.tree, args.query || '');
            const matchedList = matched.map(f => `- 📂 \`${f.relativePath}\``).join('\n');
            const resultMsg = matched.length > 0 
              ? `🔍 **本地小说库检索结果**：寻找到以下相符的设定文献与文本档案：\n\n${matchedList}\n\n*可以直接下达类似“往该文件中增加一条设定...”的指令来快速更新。*`
              : `🔍 **本地小说库检索结果**：未找到任何包含关键词“${args.query || ''}”的文件。`;
            updateCurrentProject(prev => ({
              ...prev,
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: resultMsg,
                type: 'text',
                tabContext: currentChatContext
              })
            }));
          } else {
            throw new Error(data.error || '无法获取文档目录结构');
          }
        } else if (args.action === 'read_library_file') {
          const resp = await fetch(`/api/documents/read?path=${encodeURIComponent(args.filePath)}`);
          const data = await resp.json();
          if (data.success) {
            updateCurrentProject(prev => ({
              ...prev,
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `📖 **读取本地库文本【${args.filePath}】内容如下：**\n\n\`\`\`text\n${data.content || '（文件内容为空）'}\n\`\`\``,
                type: 'text',
                tabContext: currentChatContext
              })
            }));
          } else {
            throw new Error(`读取文件发生异常: ${data.error || '文件不存在'}`);
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
            } catch (e) {
              console.log("File possibly does not exist yet during append, starting fresh.");
            }
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
          if (saveResult.success) {
            updateCurrentProject(prev => ({
              ...prev,
              messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
                id: Date.now().toString(),
                role: 'system',
                content: `✅ 已成功对物理库文件【${args.filePath}】执行录入保存：\n\n- **录入信息**：「${args.content}」\n- **写入模式**：${mode === 'append' ? '换行追加写入' : '覆盖写入'}\n现在可以在本地磁盘或设定资料管理中查看最新的设定状态！`,
                type: 'text',
                tabContext: currentChatContext
              })
            }));
          } else {
            throw new Error(saveResult.error || '保存物理文件发生异常');
          }
        } else if (args.action === 'add_note') {
          const newNote = {
            id: `note-${Date.now()}`,
            content: args.content || '新灵感记录...',
            createdAt: new Date().toISOString(),
            color: args.color || 'bg-yellow-50'
          };
          updateCurrentProject(prev => ({
            notes: [newNote, ...(prev.notes || [])],
            messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `✅ 已成功提取并收录新的脑洞灵感到【灵感小记】卡片集中！可以在对应的面板中随时查阅。`,
              type: 'text',
              tabContext: 'notes'
            })
          }));
          setActiveTab('notes');
        } else if (args.action === 'add_character') {
          const newChar = {
            id: `char-${Date.now()}`,
            name: args.name || '新角色',
            role: args.role || '无定位',
            description: args.description || '',
            traits: args.traits || []
          };
          updateCurrentProject(prev => ({
            characters: [newChar, ...(prev.characters || [])],
            messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
              id: Date.now().toString(),
              role: 'system',
              content: `✅ 已成功提取并收录新的角色设定卡片【${newChar.name}】到【人文设定】中！`,
              type: 'text',
              tabContext: 'characters'
            })
          }));
          setActiveTab('characters');
        } else {
           updateCurrentProject(prev => ({
             messages: prev.messages.filter(m => m.id !== pendingMsgId).concat({
               id: Date.now().toString(),
               role: 'system',
               content: `❌ 未知或不支持的操作: ${args.action || '无'}`,
               type: 'text',
               tabContext: currentChatContext
             })
           }));
        }
      } catch (err: any) {
        updateCurrentProject(prev => ({
           messages: prev.messages.filter(m => m.content !== '⏳ 正在调用本地工具模块执行操作...').concat({
               id: Date.now().toString(),
               role: 'system',
               content: `❌ 工具执行失败: ${err.message}`,
               type: 'text',
               tabContext: currentChatContext
           })
        }));
      }
    }
  };

// Node Handlers
  const handleAddNode = (parentId?: string, nodeType: 'main' | 'branch' = 'branch') => {
    const newNode: StoryNode = {
      id: `node-${Date.now()}`,
      title: '新节点',
      summary: '请填写摘要',
      content: '请填写内容纲要',
      parentId: parentId !== undefined ? parentId : (activeNodeId || null),
      nodeType
    };
    updateCurrentProject(prev => ({
      storyNodes: [...prev.storyNodes, newNode]
    }));
    setActiveNodeId(newNode.id);
  };

  const handleUpdateNode = (id: string, updates: Partial<StoryNode>) => {
    updateCurrentProject(prev => ({
      storyNodes: prev.storyNodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));
  };

  const handleDeleteNode = (id: string) => {
    updateCurrentProject(prev => ({
      storyNodes: prev.storyNodes.filter(n => n.id !== id)
    }));
    if (activeNodeId === id) {
      setActiveNodeId(currentProject.storyNodes.filter(n => n.id !== id)[0]?.id || '');
    }
  };

  // Chapter Handlers
  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: '新章节',
      isActive: false,
      content: '请开始创作...'
    };
    updateCurrentProject(prev => ({
      chapters: [...prev.chapters, newChapter]
    }));
  };

  const handleUpdateChapter = (id: string, updates: Partial<Chapter>) => {
    updateCurrentProject(prev => ({
      chapters: prev.chapters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleDeleteChapter = (id: string) => {
    updateCurrentProject(prev => {
      const newChapters = prev.chapters.filter(c => c.id !== id);
      if (newChapters.length === 0) {
        newChapters.push({ id: `chapter-${Date.now()}`, title: '新章节', isActive: true, content: '' });
      }
      return { chapters: newChapters };
    });
  };

  // Character Handlers
  const handleAddCharacter = () => {
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: '新角色',
      role: '角色身份',
      description: '角色描述',
      traits: ['性格标签']
    };
    updateCurrentProject(prev => ({
      characters: [...prev.characters, newChar]
    }));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterProfile>) => {
    updateCurrentProject(prev => ({
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleDeleteCharacter = (id: string) => {
    updateCurrentProject(prev => ({
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  // Editor Text Selection Prompts and Actions
  const handleTriggerRewrite = (selectedText: string, range: { start: number; end: number }) => {
    const currentChapter = currentProject.chapters.find(c => c.isActive) || currentProject.chapters[0];
    if (!currentChapter) return;

    setActiveTab('editor');
    const promptMessage = `【重写请求】
选中的文字：“${selectedText}”
字数范围：[第 ${range.start} - ${range.end} 字]

请结合本小说的语言风格、前文剧情设定、人物口吻，对上述选中的特定段落文字进行重写与文笔升华。并且保证前后上下文逻辑和叙事张力的极佳连贯性。
请在润色/重写完毕后，务必输出一个包含编辑工具标签的执行提案：形如 <args>{"action": "replace_chapter_text", "chapterId": "${currentChapter.id}", "start": ${range.start}, "end": ${range.end}, "oldText": ${JSON.stringify(selectedText)}, "newText": "[此处填入为您重写或润色升华后的精彩文字]"}</args> 。`;

    handleSendMessage(promptMessage);
  };

  const handleTriggerDiscuss = (selectedText: string, range: { start: number; end: number }, userCritique: string) => {
    const currentChapter = currentProject.chapters.find(c => c.isActive) || currentProject.chapters[0];
    if (!currentChapter) return;

    setActiveTab('editor');
    const promptMessage = `【情节讨论与意见见解】
选中的文字：“${selectedText}”
字数范围：[第 ${range.start} - ${range.end} 字]
作者想法创意：${userCritique}

请针对作者提出的见解，与作者一同进行头脑风暴讨论。分析这部分内容在小说中的戏剧功用，以及如何更完美地进行故事续写或润色。
同时，如果你认同作者的构思，或者在讨论思考之上有了更具体的改写方案，请直接输出对正文内容进行替换改写的执行提案：形如 <args>{"action": "replace_chapter_text", "chapterId": "${currentChapter.id}", "start": ${range.start}, "end": ${range.end}, "oldText": ${JSON.stringify(selectedText)}, "newText": "[讨论确立后的全新精彩文本]"}</args>。`;

    handleSendMessage(promptMessage);
  };

  const handleTriggerQuery = (selectedText: string, range: { start: number; end: number }) => {
    const currentChapter = currentProject.chapters.find(c => c.isActive) || currentProject.chapters[0];
    if (!currentChapter) return;

    setActiveTab('editor');
    const promptMessage = `【情节逻辑疑问解答】
选中的文字：“${selectedText}”
字数范围：[第 ${range.start} - ${range.end} 字]

我对上述情节在这里的发展线索或人物逻辑行为感到困惑，为什么这里的角色会做出这样的抉择，或者是这一部分的戏剧性设计思路有什么意向？
请作为我的金牌小说顾问，为我深度解惑、剖析这里的写法设定，并提供相应的优化或续写启发思路。`;

    handleSendMessage(promptMessage);
  };

  // Note Handlers
  const handleAddNote = () => {
    const newNote: InspirationNote = {
      id: `note-${Date.now()}`,
      content: '新灵感记录...',
      createdAt: new Date().toISOString(),
      color: 'bg-yellow-50'
    };
    updateCurrentProject(prev => ({
      notes: [...prev.notes, newNote]
    }));
  };

  const handleUpdateNote = (id: string, updates: Partial<InspirationNote>) => {
    updateCurrentProject(prev => ({
      notes: prev.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));
  };

  const handleDeleteNote = (id: string) => {
    updateCurrentProject(prev => ({
      notes: prev.notes.filter(n => n.id !== id)
    }));
  };

  // Background Handlers
  const handleUpdateBackground = (updates: Partial<BackgroundSetting>) => {
    updateCurrentProject(prev => {
      const mergedTimeline = updates.timeline !== undefined ? sortTimelineEvents(updates.timeline) : prev.background.timeline;
      return {
        ...prev,
        background: {
          ...prev.background,
          ...updates,
          timeline: mergedTimeline
        }
      };
    });
  };

  const handleRollbackLog = (logId: string) => {
    updateCurrentProject(prev => {
      const logs = prev.background.historyLogs || [];
      const logToRollback = logs.find(l => l.id === logId);
      if (!logToRollback) return prev;

      return {
        ...prev,
        background: {
          ...prev.background,
          ...logToRollback.preState,
          historyLogs: logs.filter(l => l.id !== logId)
        },
        messages: prev.messages.concat({
          id: Date.now().toString(),
          role: 'system',
          content: `🔄 已恢复：已成功撤回【${logToRollback.description}】。`,
          type: 'text',
          tabContext: 'background'
        })
      };
    });
    setActiveTab('background');
  };

  // Concepts Handlers
  const handleAddConceptCategory = (name: string, customId?: string) => {
    const newId = customId || `cat-${Date.now()}`;
    updateCurrentProject(prev => {
      const updatedConcepts = [...(prev.concepts || []), { id: newId, name, description: '', images: [] }];
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleUpdateConceptCategory = (id: string, updates: Partial<ConceptCategory>) => {
    updateCurrentProject(prev => {
      const updatedConcepts = (prev.concepts || []).map(c => c.id === id ? { ...c, ...updates } : c);
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleDeleteConceptCategory = (id: string) => {
    updateCurrentProject(prev => {
      const updatedConcepts = (prev.concepts || []).filter(c => c.id !== id);
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleAddConceptImage = (categoryId: string, image: any) => {
    updateCurrentProject(prev => {
      const updatedConcepts = (prev.concepts || []).map(c => c.id === categoryId ? { ...c, images: [...c.images, image] } : c);
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleDeleteConceptImage = (categoryId: string, imageId: string) => {
    updateCurrentProject(prev => {
      const updatedConcepts = (prev.concepts || []).map(c => 
        c.id === categoryId 
          ? { ...c, images: c.images.filter((img: any) => img.id !== imageId) } 
          : c
      );
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleUpdateConceptImage = (categoryId: string, imageId: string, updates: Partial<ConceptImage>) => {
    updateCurrentProject(prev => {
      const updatedConcepts = (prev.concepts || []).map(c => 
        c.id === categoryId 
          ? { ...c, images: c.images.map((img: any) => img.id === imageId ? { ...img, ...updates } : img) } 
          : c
      );
      const updatedProj = { ...prev, concepts: updatedConcepts };
      fetch('/api/project/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj })
      }).catch(err => console.error("Immediate sync concept error:", err));
      return { concepts: updatedConcepts };
    });
  };

  const handleRefreshConceptsFromDisk = async () => {
    if (!currentProject?.name) return;
    try {
      const response = await fetch(`/api/project/load-concepts?novelName=${encodeURIComponent(currentProject.name)}`);
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      const data = await response.json();
      if (data.success && data.concepts) {
        updateCurrentProject({
          concepts: data.concepts
        });
      }
    } catch (e) {
      console.error("Failed to manual sync concepts from local disk:", e);
      throw e;
    }
  };

  const handleChapterClick = (chapterId: string) => {
    const updatedChapters = currentProject.chapters.map(c => ({
      ...c,
      isActive: c.id === chapterId
    }));
    updateCurrentProject({ chapters: updatedChapters });
  };

  // Determine dynamic context based on active view
  const currentContextLabels = currentProject ? ['全局人物库', '世界观约束'] : [];
  if (currentProject) {
    if (activeTab === 'editor') {
      const activeChapter = currentProject.chapters.find(c => c.isActive);
      currentContextLabels.push(`当前正文: ${activeChapter?.title || '未选择'}`);
    } else if (activeTab === 'outline' || activeTab === 'mindmap') {
      const activeNode = currentProject.storyNodes.find(n => n.id === activeNodeId);
      currentContextLabels.push(`大纲节点: ${activeNode?.title || '未选择'}`);
    } else if (activeTab === 'characters') {
      currentContextLabels.push('重点关注: 人文档案');
    }
  }

  // Filter messages for the current tab
  const currentTabMessages = currentProject ? currentProject.messages.filter(
    (m) => m.tabContext === currentChatContext || !m.tabContext
  ) : [];

  // Compute root styles
  const rootStyle: React.CSSProperties = {
    ...(theme.backgroundType === 'image' && {
      backgroundImage: `url(${theme.backgroundValue})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    ...(theme.backgroundType === 'color' && {
      backgroundColor: theme.backgroundValue,
    })
  };

  // Compute Glassmorphism styles
  const panelStyle: React.CSSProperties = {
    backgroundColor: `rgba(255, 255, 255, ${theme.panelOpacity})`,
    backdropFilter: `blur(${theme.blurAmount}px)`,
    WebkitBackdropFilter: `blur(${theme.blurAmount}px)`,
  };

  const handleDownloadAsset = async (assetId: string) => {
    if (!currentProject) return;
    let dataToExport: any = null;
    let filename = `${currentProject.name}_${assetId}.json`;
    let isTxt = false;
    
    switch (assetId) {
      case 'editor':
        // Format the entire novel manuscript draft as a beautiful plain text .txt file
        let plainText = "";
        currentProject.chapters.forEach((c, index) => {
          plainText += `第 ${index + 1} 章: ${c.title}\n\n${c.content || ""}\n\n\n`;
        });
        dataToExport = plainText.trim();
        filename = `${currentProject.name}_正文草稿.txt`;
        isTxt = true;
        break;
      case 'outline':
      case 'mindmap':
        dataToExport = currentProject.storyNodes;
        break;
      case 'notes':
        dataToExport = currentProject.notes;
        break;
      case 'characters':
        dataToExport = currentProject.characters;
        break;
      case 'background':
        dataToExport = currentProject.background;
        break;
      case 'concept':
        dataToExport = currentProject.concepts;
        break;
      case 'ai-context':
        dataToExport = currentProject.messages;
        break;
    }

    if (dataToExport) {
      const payloadString = isTxt ? dataToExport : JSON.stringify(dataToExport, null, 2);
      const mimeType = isTxt ? 'text/plain;charset=utf-8' : 'application/json';

      const handle = (window as any).storageDirHandle;
      if (handle) {
         try {
            const fileHandle = await handle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(payloadString);
            await writable.close();
            // Just notify user
            alert(`已保存至 ${handle.name}/${filename}`);
            return;
         } catch (e: any) {
            console.error("保存失败，回退到普通下载", e);
         }
      }

      // fallback to generic download
      const blob = new Blob([payloadString], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportProject = (importedProject: NovelProject) => {
    if (!importedProject || !importedProject.name) return;
    const newProject = {
      ...importedProject,
      id: `proj-${Date.now()}`,
      name: importedProject.name + " (归档恢复)"
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    alert("小说工程归档已被成功恢复为新项目。");
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans transition-colors duration-500" style={rootStyle}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onNewNovel={() => setIsNewNovelOpen(true)}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        currentProjectId={currentProjectId}
        onSelectProject={setCurrentProjectId}
        onCloseProject={handleCloseProject}
        onResetLayout={handleResetLayout}
        isAiConnected={settings.isAiConnected}
      />
      
      <main className="flex flex-1 overflow-hidden p-3 gap-3 max-w-none w-full px-4 mx-auto items-start">
        {!currentProject ? (
          <div className="flex-1 rounded-xl overflow-hidden shadow-xl flex items-center justify-center border border-white/20 text-white flex-col gap-4" style={panelStyle}>
             <BookPlus className="w-12 h-12 opacity-50 text-gray-800" />
             <div className="text-xl font-medium text-gray-800">暂无打开的项目</div>
             <button 
                onClick={() => setIsNewNovelOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
             >
                创建一个新项目
             </button>
          </div>
        ) : (
          <>
            {activeTab === 'editor' && (
              <div 
                className="rounded-xl overflow-hidden shadow-xl flex h-full border border-white/20 transition-all shrink-0 relative group animate-fade-in" 
                style={{
                  ...panelStyle,
                  width: sidebarWidth[activeTab] !== undefined ? `${sidebarWidth[activeTab]}px` : '260px',
                  height: sidebarHeight[activeTab] !== undefined ? `${sidebarHeight[activeTab]}px` : '100%',
                }}
              >
                <ChapterSidebar 
                  chapters={currentProject.chapters} 
                  onChapterClick={handleChapterClick} 
                  onAddChapter={handleAddChapter} 
                  onUpdateChapter={handleUpdateChapter}
                  onDeleteChapter={handleDeleteChapter}
                />
                
                {/* Visual Resize drag handle - Width (LEFT border) */}
                <div 
                  className="absolute top-0 left-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                  onMouseDown={(e) => startResizeWidth(e, 'sidebar', 'left')}
                  title="拖拽边线改变宽度 (双击恢复默认)"
                  onDoubleClick={() => resetWidth('sidebar')}
                >
                  <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
                </div>

                {/* Visual Resize drag handle - Width (RIGHT border) */}
                <div 
                  className="absolute top-0 right-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                  onMouseDown={(e) => startResizeWidth(e, 'sidebar', 'right')}
                  title="拖拽边线改变宽度 (双击恢复默认)"
                  onDoubleClick={() => resetWidth('sidebar')}
                >
                  <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
                </div>
                
                {/* Visual Resize drag handle - Height (TOP border) */}
                <div 
                  className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                  onMouseDown={(e) => startResizeHeight(e, 'sidebar', 'top')}
                  title="拖拽边线改变高度 (双击恢复默认)"
                  onDoubleClick={() => resetHeight('sidebar')}
                >
                  <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
                </div>

                {/* Visual Resize drag handle - Height (BOTTOM border) */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                  onMouseDown={(e) => startResizeHeight(e, 'sidebar', 'bottom')}
                  title="拖拽边线改变高度 (双击恢复默认)"
                  onDoubleClick={() => resetHeight('sidebar')}
                >
                  <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
                </div>
              </div>
            )}
            
            <div 
              className={`${mainWidth[activeTab] !== undefined ? '' : 'flex-1'} rounded-xl overflow-hidden shadow-xl flex h-full border border-white/20 transition-all relative group`} 
              style={{
                ...panelStyle,
                width: mainWidth[activeTab] !== undefined ? `${mainWidth[activeTab]}px` : undefined,
                height: mainHeight[activeTab] !== undefined ? `${mainHeight[activeTab]}px` : '100%',
              }}
            >
              {activeTab === 'editor' && (
                <Editor 
                  chapter={currentProject.chapters.find(c => c.isActive) || currentProject.chapters[0]} 
                  onUpdateChapter={handleUpdateChapter}
                  onTriggerRewrite={handleTriggerRewrite}
                  onTriggerDiscuss={handleTriggerDiscuss}
                  onTriggerQuery={handleTriggerQuery}
                />
              )}
              {activeTab === 'characters' && <CharactersView characters={currentProject.characters} onAddCharacter={handleAddCharacter} onUpdateCharacter={handleUpdateCharacter} onDeleteCharacter={handleDeleteCharacter} />}
              {activeTab === 'notes' && <NotesView notes={currentProject.notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />}
              {activeTab === 'outline' && (
                <OutlineView 
                  nodes={currentProject.storyNodes} 
                  activeNodeId={activeNodeId} 
                  onNodeSelect={setActiveNodeId}
                  onGoToMindmap={(id) => {
                    setActiveNodeId(id);
                    setActiveTab('mindmap');
                  }}
                  onAddNode={handleAddNode}
                  onUpdateNode={handleUpdateNode}
                  onDeleteNode={handleDeleteNode}
                />
              )}
              {activeTab === 'mindmap' && (
                <MindmapView 
                  nodes={currentProject.storyNodes}
                  onGoToOutline={(id) => {
                    setActiveNodeId(id);
                    setActiveTab('outline');
                  }}
                  onAddNode={handleAddNode}
                  onUpdateNode={handleUpdateNode}
                  onDeleteNode={handleDeleteNode}
                />
              )}
              {activeTab === 'background' && (
                <BackgroundView 
                  background={currentProject.background} 
                  onUpdateBackground={handleUpdateBackground} 
                  onRollbackLog={handleRollbackLog}
                />
              )}
              {activeTab === 'concept' && (
                <ConceptArtView 
                  categories={currentProject.concepts || []}
                  onAddCategory={handleAddConceptCategory}
                  onUpdateCategory={handleUpdateConceptCategory}
                  onDeleteCategory={handleDeleteConceptCategory}
                  onAddImage={handleAddConceptImage}
                  onDeleteImage={handleDeleteConceptImage}
                  onUpdateImage={handleUpdateConceptImage}
                  characters={currentProject.characters || []}
                  onSyncToCharacter={(characterId, imageUrl) => handleUpdateCharacter(characterId, { avatar: imageUrl })}
                  onRefreshDisk={handleRefreshConceptsFromDisk}
                />
              )}

              {/* Visual Resize drag handle - Width (LEFT border) */}
              <div 
                className="absolute top-0 left-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeWidth(e, 'main', 'left')}
                title="拖拽边线改变宽度 (双击恢复默认)"
                onDoubleClick={() => resetWidth('main')}
              >
                <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>

              {/* Visual Resize drag handle - Width (RIGHT border) */}
              <div 
                className="absolute top-0 right-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeWidth(e, 'main', 'right')}
                title="拖拽边线改变宽度 (双击恢复默认)"
                onDoubleClick={() => resetWidth('main')}
              >
                <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>
              
              {/* Visual Resize drag handle - Height (TOP border) */}
              <div 
                className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeHeight(e, 'main', 'top')}
                title="拖拽边线改变高度 (双击恢复默认)"
                onDoubleClick={() => resetHeight('main')}
              >
                <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>

              {/* Visual Resize drag handle - Height (BOTTOM border) */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeHeight(e, 'main', 'bottom')}
                title="拖拽边线改变高度 (双击恢复默认)"
                onDoubleClick={() => resetHeight('main')}
              >
                <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>
            </div>

            <div 
              className="rounded-xl overflow-hidden shadow-xl flex h-full border border-white/20 transition-all shrink-0 relative group" 
              style={{
                ...panelStyle,
                width: chatWidth[activeTab] !== undefined ? `${chatWidth[activeTab]}px` : '320px',
                height: chatHeight[activeTab] !== undefined ? `${chatHeight[activeTab]}px` : '100%',
              }}
            >
              <AIChat 
                messages={currentTabMessages} 
                onSendMessage={handleSendMessage} 
                onAdoptProposal={handleAdoptProposal}
                currentContext={currentContextLabels}
                currentModel={settings.tabSettings?.[activeTab]?.model || ''}
                globalModel={settings.customModel}
                connectedModels={settings.connectedModels || []}
                tabId={activeTab}
                conceptMode={conceptMode}
                onConceptModeChange={setConceptMode}
                isGenerating={isGenerating}
                onStopGeneration={handleStopGeneration}
                onModelChange={(newModel) => {
                  const existingTabConfig = settings.tabSettings?.[activeTab] || { model: '', systemPrompt: '' };
                  setSettings({
                    ...settings,
                    tabSettings: {
                      ...(settings.tabSettings || {}),
                      [activeTab]: {
                        ...existingTabConfig,
                        model: newModel
                      }
                    }
                  });
                }}
              />

              {/* Visual Resize drag handle - Width (dragging from the LEFT border) */}
              <div 
                className="absolute top-0 left-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeWidth(e, 'chat', 'left')}
                title="拖拽边线改变宽度 (双击恢复默认)"
                onDoubleClick={() => resetWidth('chat')}
              >
                <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>

              {/* Visual Resize drag handle - Width (dragging from the RIGHT border) */}
              <div 
                className="absolute top-0 right-0 w-2 bg-transparent hover:bg-blue-500/30 cursor-col-resize h-full transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeWidth(e, 'chat', 'right')}
                title="拖拽边线改变宽度 (双击恢复默认)"
                onDoubleClick={() => resetWidth('chat')}
              >
                <div className="w-0.5 h-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>
              
              {/* Visual Resize drag handle - Height (TOP border) */}
              <div 
                className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeHeight(e, 'chat', 'top')}
                title="拖拽边线改变高度 (双击恢复默认)"
                onDoubleClick={() => resetHeight('chat')}
              >
                <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>

              {/* Visual Resize drag handle - Height (BOTTOM border) */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-500/30 cursor-row-resize transition-colors z-45 flex items-center justify-center group-hover:opacity-100 opacity-20"
                onMouseDown={(e) => startResizeHeight(e, 'chat', 'bottom')}
                title="拖拽边线改变高度 (双击恢复默认)"
                onDoubleClick={() => resetHeight('chat')}
              >
                <div className="h-0.5 w-8 bg-[#475569]/70 rounded-full group-hover:bg-blue-500" />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating button to reset active tab sizing layout to default */}
      {currentProject && (
        <button
          onClick={handleResetTabLayout}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95 group select-none cursor-pointer"
          title="点击将当前页面的布局和窗口大小重置为默认值"
        >
          <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-60deg] transition-transform duration-300" />
          <span>恢复默认布局</span>
        </button>
      )}

      <ThemeModal 
        isOpen={isThemeOpen} 
        onClose={() => setIsThemeOpen(false)} 
        theme={theme}
        setTheme={setTheme}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        setSettings={setSettings}
        onImportProject={handleImportProject}
        currentProject={currentProject}
      />

      <LibraryModal 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        novelName={currentProject?.name || ''}
        onNavigate={(tab: string) => setActiveTab(tab as TabType)}
        onExport={handleDownloadAsset}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <CreateNovelModal 
        isOpen={isNewNovelOpen} 
        onClose={() => setIsNewNovelOpen(false)}
        onCreate={handleCreateNovel}
        canClose={projects.length > 0}
      />

      <DirectoryInitModal 
        isOpen={isFirstRunModalOpen}
        onConfirm={handleConfirmSavePath}
      />

      {currentProject && (
        <GlobalAIWidget 
          currentProject={currentProject}
          updateCurrentProject={updateCurrentProject}
          onRefreshConcepts={handleRefreshConceptsFromDisk}
          settings={{
            apiUrl: settings.apiUrl,
            apiKey: settings.apiKey,
            customModel: settings.customModel
          }}
        />
      )}
    </div>
  );
}
