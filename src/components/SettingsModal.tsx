import React, { useState } from 'react';
import { AppSettings, ModelProvider } from '../types';
import { X, Network, Key, Server, Save, Folder, FileText, Check, Activity, AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const defaultConstants = [
  { id: 'DeepSeek', name: 'DeepSeek', apiUrl: 'https://api.deepseek.com/v1', apiKey: '', customModel: 'deepseek-chat' },
  { id: 'Kimi', name: 'Kimi (Moonshot)', apiUrl: 'https://api.moonshot.cn/v1', apiKey: '', customModel: 'moonshot-v1-8k' },
  { id: 'Qwen', name: 'Qwen (通义千问)', apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '', customModel: 'qwen-turbo' },
  { id: 'Zhipu', name: 'Zhipu (智谱)', apiUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '', customModel: 'glm-4-flash' },
  { id: 'OpenAI', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1', apiKey: '', customModel: 'gpt-4o-mini' }
];

const defaultTabPrompts: Record<string, string> = {
  editor: `你是一位顶级的小说执笔专家与主笔。专注于润色文本、扩写故事、完善情节。请全力配合作者对段落和章回的需求进行高规格文学重写。
请专注于文学技巧、段落节奏、氛围渲染和人物对话的生动描摹。`,
  outline: `你是一位顶尖的悬念及大纲构建师。能基于极少线索规划完美的戏剧弧光、剧情转折、线索伏笔、以及高潮起伏。
提供完整的三幕式大纲设计，对情节节奏给予精准指导。`,
  mindmap: `你是一位思维发散与因果推理大师。帮助作者理清复杂的家族势力、力量体系、阴谋网络、以及线索链。
构建合乎逻辑的分支脉络，梳理错综交织的人物因果。`,
  notes: `你是一位极富想象力的小说脑洞捕手，擅长捕捉那些天马行空、不着边际的碎片灵感，将其淬炼成符合世界设定的瑰丽创意。
自动评估灵感质量，生成启发式的创意思维拓展。`,
  characters: `你是一位大师级的人物侧写师，擅长塑造血肉丰满、灵魂真实的小说人物。设计多维度的冲突根源、语言特质和外貌伏笔。
分析性格对剧情的驱动力，使每个配角都有独特的动机。`,
  background: `你是一位世界构建专家（Wordbuilder）。专注于建立宏大、严谨的物理法则、地理关系和历史编年史。
当用户要增改世界观时，请配合输出微缩工具标签 <args>...</args> 以便他们一键将你的规划和设定自动写入数据库中。`,
  concept: `你是一位卓越的科幻魔幻概念画师 and 美学大师。擅长为小说的各种神话道具、地理景观、装甲服饰提炼极精确、极写意的画面 Prompt 指令。
生成极有质感的概念设计词，方便一键进行高品质插画或概念草图生成。`
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'tabSettings' | 'storage'>('ai');
  const [selectedTabForConfig, setSelectedTabForConfig] = useState<string>('editor');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form states for adding or editing a provider
  const [isEditingProvider, setIsEditingProvider] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    apiUrl: string;
    apiKey: string;
    customModel: string;
    isCustom: boolean;
    isNew: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const providersList = settings.providers || defaultConstants;

  const handleSelectProvider = (provider: ModelProvider) => {
    setSettings({
      ...settings,
      aiProvider: provider.id,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
      customModel: provider.customModel
    });
    setTestResult(null);
  };

  const handleAddCustomProviderClick = () => {
    setValidationError(null);
    setEditForm({
      id: `custom-${Date.now()}`,
      name: '自定义大模型',
      apiUrl: '',
      apiKey: '',
      customModel: '',
      isCustom: true,
      isNew: true
    });
    setIsEditingProvider(true);
  };

  const handleEditProviderClick = (provider: ModelProvider, e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationError(null);
    setEditForm({
      id: provider.id,
      name: provider.name,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
      customModel: provider.customModel,
      isCustom: !!provider.isCustom,
      isNew: false
    });
    setIsEditingProvider(true);
  };

  const handleDeleteProviderClick = (providerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(providerId);
  };

  const executeDeleteProvider = (providerId: string) => {
    const remainingProviders = providersList.filter(p => p.id !== providerId);
    
    // If the currently selected provider is being deleted, fallback to the first one available
    let fallbackId = settings.aiProvider;
    let updatedSettings = { ...settings, providers: remainingProviders };
    if (settings.aiProvider === providerId) {
      const fallbackProvider = remainingProviders[0] || defaultConstants[0];
      fallbackId = fallbackProvider.id;
      updatedSettings = {
        ...updatedSettings,
        aiProvider: fallbackId,
        apiUrl: fallbackProvider.apiUrl,
        apiKey: fallbackProvider.apiKey,
        customModel: fallbackProvider.customModel
      };
    }
    setSettings(updatedSettings);
    setTestResult(null);
    setDeletingId(null);
  };

  const handleSaveProviderForm = () => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      setValidationError('请输入模型渠道名称');
      return;
    }
    setValidationError(null);

    const updatedProvider: ModelProvider = {
      id: editForm.id,
      name: editForm.name.trim(),
      apiUrl: editForm.apiUrl.trim(),
      apiKey: editForm.apiKey.trim(),
      customModel: editForm.customModel.trim(),
      isCustom: editForm.isCustom
    };

    let updatedProviders: ModelProvider[];
    if (editForm.isNew) {
      updatedProviders = [...providersList, updatedProvider];
    } else {
      updatedProviders = providersList.map(p => p.id === editForm.id ? updatedProvider : p);
    }

    // Auto update top-level API settings if current selected provider was edited or if a new one is saved
    const isCurrentlySelected = settings.aiProvider === editForm.id || editForm.isNew;

    setSettings({
      ...settings,
      providers: updatedProviders,
      ...(isCurrentlySelected ? {
        aiProvider: updatedProvider.id,
        apiUrl: updatedProvider.apiUrl,
        apiKey: updatedProvider.apiKey,
        customModel: updatedProvider.customModel
      } : {})
    });

    setIsEditingProvider(false);
    setEditForm(null);
  };

  // Sync inline edits on the top-level inputs back to the active provider in providersList
  const handleTopLevelParamChange = (field: 'apiUrl' | 'apiKey' | 'customModel', val: string) => {
    const updatedProviders = providersList.map(p => {
      if (p.id === settings.aiProvider) {
        return {
          ...p,
          [field]: val
        };
      }
      return p;
    });

    setSettings({
      ...settings,
      [field]: val,
      providers: updatedProviders
    });
  };

  const handleTestConnection = async () => {
    if (!settings.apiUrl || !settings.apiKey || !settings.customModel) {
      setTestResult({ success: false, message: '请先配置 API 地址、API 密钥以及模型名称' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

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
        const modelName = settings.customModel;
        const alreadyConnected = settings.connectedModels || [];
        const updatedConnected = alreadyConnected.includes(modelName)
          ? alreadyConnected
          : [...alreadyConnected, modelName];

        setSettings({
          ...settings,
          isAiConnected: true,
          connectedModels: updatedConnected
        });
        setTestResult({ success: true, message: data.message });
      } else {
        setSettings({
          ...settings,
          isAiConnected: false
        });
        setTestResult({ success: false, message: data.error || '通信连接失败' });
      }
    } catch (e: any) {
      setSettings({
        ...settings,
        isAiConnected: false
      });
      setTestResult({ success: false, message: e.message || '请求遭遇网络异常' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        (window as any).storageDirHandle = handle;
        setSettings({ ...settings, storageDirectory: handle.name });
      } else {
        alert("当前浏览器不支持本地文件夹访问API");
      }
    } catch (e: any) {
      if (e.message?.includes('Cross origin') || e.name === 'SecurityError') {
        alert("由于运行在平台预览窗口中（IFrame），为安全起见无法直接选择文件目录。\n\n如需设置本地文件夹，请使用预览框右上角的【在新标签页中打开】。当前将回退至普通下载模式。");
      } else if (e.name !== 'AbortError') {
        console.error(e);
        alert("选择文件夹失败：" + e.message);
      }
    }
  };

  const getCurrentTabModel = (tabKey: string) => {
    return settings.tabSettings?.[tabKey]?.model || '';
  };

  const getCurrentTabPrompt = (tabKey: string) => {
    return settings.tabSettings?.[tabKey]?.systemPrompt ?? (defaultTabPrompts[tabKey] || '');
  };

  const handleTabModelChange = (tabKey: string, modelVal: string) => {
    const existingTabConfig = settings.tabSettings?.[tabKey] || { model: '', systemPrompt: defaultTabPrompts[tabKey] || '' };
    const tabSettings = {
      ...(settings.tabSettings || {}),
      [tabKey]: {
        ...existingTabConfig,
        model: modelVal
      }
    };
    setSettings({
      ...settings,
      tabSettings
    });
  };

  const handleTabPromptChange = (tabKey: string, promptVal: string) => {
    const existingTabConfig = settings.tabSettings?.[tabKey] || { model: '', systemPrompt: defaultTabPrompts[tabKey] || '' };
    const tabSettings = {
      ...(settings.tabSettings || {}),
      [tabKey]: {
        ...existingTabConfig,
        systemPrompt: promptVal
      }
    };
    setSettings({
      ...settings,
      tabSettings
    });
  };

  const resetTabPromptToDefault = (tabKey: string) => {
    const existingTabConfig = settings.tabSettings?.[tabKey] || { model: '', systemPrompt: '' };
    const tabSettings = {
      ...(settings.tabSettings || {}),
      [tabKey]: {
        ...existingTabConfig,
        systemPrompt: defaultTabPrompts[tabKey] || ''
      }
    };
    setSettings({
      ...settings,
      tabSettings
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[680px] overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Editor Modal Overlay */}
        {isEditingProvider && editForm && (
          <div className="absolute inset-0 bg-white/95 z-50 flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h4 className="font-bold text-gray-800 text-base">
                {editForm.isNew ? '✨ 新增自定义模型选择配置' : '📝 编辑模型选择配置'}
              </h4>
              <button 
                onClick={() => { setIsEditingProvider(false); setEditForm(null); }}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">渠道显示名称</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="例如: 我的 DeepSeek 高并发通道"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">API 终点地址 (Base URL)</label>
                <input 
                  type="text" 
                  value={editForm.apiUrl}
                  onChange={(e) => setEditForm({ ...editForm, apiUrl: e.target.value })}
                  placeholder="如: https://api.deepseek.com/v1"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">API 密钥 (API Key)</label>
                <input 
                  type="password" 
                  value={editForm.apiKey}
                  onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">模型识别代号 (Model Name)</label>
                <input 
                  type="text" 
                  value={editForm.customModel}
                  onChange={(e) => setEditForm({ ...editForm, customModel: e.target.value })}
                  placeholder="如: deepseek-chat"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border">
              <div>
                {validationError && (
                  <span className="text-xs text-red-650 font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                    ⚠️ {validationError}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsEditingProvider(false); setEditForm(null); setValidationError(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveProviderForm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存并绑定当前</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">系统与 AI 配置设置</h3>
            {settings.isAiConnected ? (
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                AI通信正常
              </span>
            ) : (
              <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                AI未测试/连接阻断
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md text-gray-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden min-h-[440px]">
          {/* Side Menu */}
          <div className="w-48 bg-gray-50 border-r border-gray-100 p-2 space-y-1 select-none">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'ai' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Server className="w-4 h-4" />
              AI 统一参数
            </button>
            <button 
              onClick={() => setActiveTab('tabSettings')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'tabSettings' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText className="w-4 h-4" />
              Tab 助手定制
            </button>
            <button 
              onClick={() => setActiveTab('storage')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'storage' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Save className="w-4 h-4" />
              存储目录设定
            </button>
          </div>
          
          {/* Main Content Pane */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            
            {/* AI General Config */}
            {activeTab === 'ai' && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">模型选择</h4>
                    <button 
                      onClick={handleAddCustomProviderClick}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100/80 rounded border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新增模型渠道</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {providersList.map(provider => (
                      <div 
                        key={provider.id} 
                        onClick={() => handleSelectProvider(provider)}
                        className={`flex items-center justify-between p-2 pb-2.5 border rounded-lg cursor-pointer hover:bg-gray-50/50 transition-colors group ${
                          settings.aiProvider === provider.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <input 
                            type="radio" 
                            name="provider" 
                            checked={settings.aiProvider === provider.id}
                            onChange={() => handleSelectProvider(provider)}
                            className="text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                          />
                          <div className="truncate min-w-0 pr-2">
                            <span className="text-sm font-bold text-gray-800 block truncate">{provider.name}</span>
                            <span className="text-[10px] text-gray-400 shrink-0 font-mono block truncate">{provider.customModel || '未设定版本'} · {provider.apiUrl || '系统内置'}</span>
                          </div>
                        </div>

                        {/* Edit & Delete Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleEditProviderClick(provider, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="配置该通道的连接密钥、终点地址等"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {provider.isCustom && (
                            <div className="relative flex items-center">
                              {deletingId === provider.id ? (
                                <div className="flex items-center gap-1 bg-red-50/85 p-1 rounded border border-red-200 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      executeDeleteProvider(provider.id);
                                    }}
                                    className="text-[10px] bg-red-600 text-white rounded px-2 py-0.5 hover:bg-red-700 font-bold transition-all cursor-pointer shadow-sm"
                                  >
                                    确认
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(null);
                                    }}
                                    className="text-[10px] bg-gray-200 text-gray-700 rounded px-2 py-0.5 hover:bg-gray-300 font-bold transition-all cursor-pointer"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleDeleteProviderClick(provider.id, e)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="删除此自定义通道"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5">当前选中通道参数</h4>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <Network className="w-3.5 h-3.5 text-gray-400" />
                      API 终点地址 (Base URL)
                    </label>
                    <input 
                      type="text" 
                      value={settings.apiUrl}
                      onChange={(e) => handleTopLevelParamChange('apiUrl', e.target.value)}
                      placeholder="如: https://api.deepseek.com/v1"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <Key className="w-3.5 h-3.5 text-gray-400" />
                      API 密钥 (API Key)
                    </label>
                    <input 
                      type="password" 
                      value={settings.apiKey}
                      onChange={(e) => handleTopLevelParamChange('apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 block">模型识别代号 (Model Name)</label>
                    <input 
                      type="text" 
                      value={settings.customModel}
                      onChange={(e) => handleTopLevelParamChange('customModel', e.target.value)}
                      placeholder="例如: deepseek-chat"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Connection Test Area */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold tracking-wide transition-all self-start cursor-pointer group"
                      >
                        <Activity className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : 'group-hover:scale-110'}`} />
                        <span>{isTestingConnection ? '评估连接中...' : '检测当前模型通信状态'}</span>
                      </button>
                      
                      {testResult && (
                        <div className={`flex items-center gap-1 py-1 px-2.5 rounded-md text-xs font-bold leading-none ${
                          testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span className="line-clamp-1">{testResult.message}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">点击通过发送超量极轻心跳包测试连接真伪：不成功的模型将显示对应的错误报错。</p>
                  </div>

                </div>
              </>
            )}

            {/* Per Tab Assistants Custom Configuration */}
            {activeTab === 'tabSettings' && (
              <div className="space-y-4">
                <div className="space-y-1 border-b pb-3 border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800">每个 Tab AI 助手的独立预设</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    您可以任选一个创作页面，为其单独指定专属的专属模型和定制系统角色指令（提示词指导）。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">选择对应的创作页面 (Tab)</label>
                    <select 
                      value={selectedTabForConfig}
                      onChange={(e) => {
                        setSelectedTabForConfig(e.target.value);
                        setTestResult(null);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="editor">正文撰写 (Editor)</option>
                      <option value="outline">大纲设定 (Outline)</option>
                      <option value="mindmap">思维导图 (Mindmap)</option>
                      <option value="notes">灵感小记 (Notes)</option>
                      <option value="characters">人物设定 (Characters)</option>
                      <option value="background">世界构建 (Background)</option>
                      <option value="concept">概念设计图 (Concept)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 block">专属大模型绑定</label>
                    <select 
                      value={getCurrentTabModel(selectedTabForConfig)}
                      onChange={(e) => handleTabModelChange(selectedTabForConfig, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="">跟随全局配置模型 ({settings.customModel || settings.aiProvider || 'Gemini 内置'})</option>
                      <option value="deepseek-chat">DeepSeek Chat (deepseek-chat) {settings.connectedModels?.includes('deepseek-chat') ? '✓ 已成功连接' : ''}</option>
                      <option value="moonshot-v1-8k">Kimi Chat (moonshot-v1-8k) {settings.connectedModels?.includes('moonshot-v1-8k') ? '✓ 已成功连接' : ''}</option>
                      <option value="qwen-turbo font-sans">Qwen Turbo (qwen-turbo) {settings.connectedModels?.includes('qwen-turbo') ? '✓ 已成功连接' : ''}</option>
                      <option value="glm-4-flash font-sans">GLM 4 Flash (glm-4-flash) {settings.connectedModels?.includes('glm-4-flash') ? '✓ 已成功连接' : ''}</option>
                      <option value="gpt-4o-mini">GPT 4o Mini (gpt-4o-mini) {settings.connectedModels?.includes('gpt-4o-mini') ? '✓ 已成功连接' : ''}</option>
                      {settings.customModel && settings.customModel !== 'deepseek-chat' && (
                        <option value={settings.customModel}>自定义: {settings.customModel} {settings.connectedModels?.includes(settings.customModel) ? '✓ 已成功连接' : ''}</option>
                      )}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      带 ✓ 选项为当前全局下最先一次成功进行通信握手的可用模型。
                    </p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-600">系统角色提示词 (System Instructions)</label>
                      <button 
                        onClick={() => resetTabPromptToDefault(selectedTabForConfig)}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer border border-blue-200/50 rounded px-1.5 py-0.5 bg-blue-50/20"
                      >
                        恢复该 Tab 的出厂预设
                      </button>
                    </div>
                    <textarea
                      value={getCurrentTabPrompt(selectedTabForConfig)}
                      onChange={(e) => handleTabPromptChange(selectedTabForConfig, e.target.value)}
                      rows={6}
                      placeholder="自定义此创作面板的提示词指令，以规导 AI 的对话行为样式..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-gray-700 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Storage directory */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 mb-4">本地存储位置</h4>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      选择一个本地文件夹作为小说资产的存储位置。在库文件管理器中点击文件时，将直接存储到此文件夹中。
                    </p>
                    
                    <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">当前存储目录</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {settings.storageDirectory ? settings.storageDirectory : '尚未选择目录'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleSelectDirectory}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        选择文件夹
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer">
            已锁存并返回
          </button>
        </div>
      </div>
    </div>
  );
};
