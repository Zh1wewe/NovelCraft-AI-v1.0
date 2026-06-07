export type TabType = 'editor' | 'outline' | 'mindmap' | 'notes' | 'characters' | 'background' | 'concept';

export interface Chapter {
  id: string;
  title: string;
  isActive?: boolean;
  content?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'outline_proposal' | 'evaluation' | 'tool_call';
  tabContext?: string;
  proposalStatus?: 'pending' | 'adopted' | 'declined';
}

export interface AppTheme {
  backgroundType: 'color' | 'image';
  backgroundValue: string;
  panelOpacity: number;
  blurAmount: number;
}

export interface ModelProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  customModel: string;
  isCustom?: boolean;
}

export interface AppSettings {
  aiProvider: string;
  apiUrl: string;
  apiKey: string;
  customModel: string;
  autoSave: boolean;
  storageDirectory?: string;
  connectedModels?: string[]; // 已连接成功过的模型列表
  tabSettings?: Record<string, { model: string; systemPrompt: string }>; // 每个 Tab 专属的模型和系统提示词
  isAiConnected?: boolean; // 当前整体 AI 连接测试成功的状态
  providers?: ModelProvider[]; // 多模型配置及列表
}

export interface StoryNode {
  id: string;
  title: string;
  summary: string;
  content: string;
  parentId: string | null;
  parentIds?: string[];
  timeLabel?: string;
  position?: { x: number, y: number };
  nodeType?: 'main' | 'branch';
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  description: string;
  traits: string[];
}

export interface InspirationNote {
  id: string;
  content: string;
  createdAt: string;
  color?: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  event: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  actionType: 'timeline_add' | 'timeline_modify' | 'timeline_delete' | 'world_rules_update' | 'geography_update' | 'chapter_content_update' | 'outline_update';
  description: string;
  preState: any; // State before modification
  postState: any; // State after modification
}

export interface BackgroundSetting {
  worldRules: string;
  geography: string;
  timeline: TimelineEvent[];
  historyLogs?: HistoryLog[]; // Optional history logs / journal entries
}

export interface LibrarySchema {
  id: string;
  name: string;
  scope: 'novel' | 'global';
  description: string;
  content: string;
}

export interface ConceptCategory {
  id: string;
  name: string;
  description?: string;
  images: ConceptImage[];
}

export interface ConceptImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  name?: string;
  description?: string;
}

export interface NovelProject {
  id: string;
  name: string;
  chapters: Chapter[];
  messages: ChatMessage[];
  characters: CharacterProfile[];
  notes: InspirationNote[];
  storyNodes: StoryNode[];
  background: BackgroundSetting;
  schemas: LibrarySchema[];
  concepts: ConceptCategory[];
}
