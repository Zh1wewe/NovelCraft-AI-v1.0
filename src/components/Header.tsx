import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LayoutGrid, FileText, Network, Lightbulb, UserSquare2, Image as ImageIcon, Shirt, Library, ChevronDown, Check, FolderOpen, Save, FileOutput, X } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onOpenTheme: () => void;
  onOpenLibrary: () => void;
  onNewNovel: () => void;
  projects: { id: string; name: string }[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onCloseProject: (id: string, e: React.MouseEvent) => void;
  onResetLayout?: () => void;
  isAiConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings,
  onOpenTheme,
  onOpenLibrary,
  onNewNovel,
  projects,
  currentProjectId,
  onSelectProject,
  onCloseProject,
  onResetLayout,
  isAiConnected
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'editor', label: '正文撰写', icon: FileText },
    { id: 'outline', label: '大纲', icon: FileText },
    { id: 'mindmap', label: '思维导图', icon: Network },
    { id: 'notes', label: '灵感小记', icon: Lightbulb },
    { id: 'characters', label: '人物设定', icon: UserSquare2 },
    { id: 'background', label: '世界构建', icon: ImageIcon },
    { id: 'concept', label: '概念设计图', icon: ImageIcon },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-end px-3 pt-2 h-[50px] border-b border-gray-200/80 bg-white/90 backdrop-blur-md shadow-sm flex-shrink-0 z-40 relative">
      <div className="flex items-center self-center mb-1 mr-2" ref={menuRef}>
        {/* Menu Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center text-sm font-medium px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <Menu className="w-4 h-4 mr-1.5" />
            菜单
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 font-sans text-sm z-50">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">项目文件</div>
              <button onClick={() => { setIsMenuOpen(false); onNewNovel(); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 新建小说
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> 打开小说 (列表)
              </button>
              <button onClick={() => { setIsMenuOpen(false); alert('内容已自动实时保存在本地浏览器缓存中。'); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> 本地保存
              </button>
               <div className="h-px bg-gray-100 my-1"></div>
               <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">导出</div>
               <button onClick={() => { setIsMenuOpen(false); alert('已为您准备打包文件，功能模拟下载中'); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> 导出当前卷 (TXT)
              </button>
              <button onClick={() => { setIsMenuOpen(false); alert('已生成 JSON 大纲，功能模拟下载中'); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> 导出大纲设定 (JSON/MD)
              </button>
            </div>
          )}
        </div>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        {/* AI connection status indicator */}
        <div className="flex items-center ml-1.5 mr-1 select-none" title={isAiConnected ? "AI 通信连接检测正常" : "AI 当前断开或未测试"}>
          {isAiConnected ? (
            <span className="text-[11px] font-bold text-green-600 flex items-center gap-1 bg-green-50/80 border border-green-200/60 px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
              已连接
            </span>
          ) : (
            <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 bg-red-50/80 border border-red-200/60 px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
              未连接
            </span>
          )}
        </div>
      </div>
      
      {/* Dynamic Project Tabs */}
      <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-1 max-w-[600px] h-full items-end pb-[1px]">
        {projects.map(proj => {
          const isProjectActive = currentProjectId === proj.id;
          return (
            <div 
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className={`group flex items-center min-w-[120px] max-w-[200px] h-[34px] px-3 cursor-pointer select-none transition-all rounded-t-lg border-x border-t relative mb-[-1px] ${
                isProjectActive 
                  ? 'bg-[#f8fafc] border-gray-300/80 text-gray-900 z-10 before:absolute before:bottom-[-2px] before:left-0 before:right-0 before:h-[3px] before:bg-[#f8fafc]' 
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100/50'
              }`}
            >
              <div className="flex items-center justify-between w-full h-full pb-0.5">
                <div className={`truncate flex-1 text-[13px] ${isProjectActive ? 'font-bold' : 'font-medium'}`}>{proj.name}</div>
                <button 
                  onClick={(e) => onCloseProject(proj.id, e)}
                  className={`ml-2 p-0.5 rounded transition-all flex-shrink-0 ${isProjectActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50/50'}`}
                  title="关闭项目"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center space-x-5 ml-auto self-center mb-[5px] pl-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-1 px-1 py-1 text-sm transition-colors border-b-2 -mb-2 pb-2 ${
                isActive ? 'text-blue-600 border-blue-600 font-bold' : 'text-gray-500 border-transparent hover:text-gray-800 font-medium'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end space-x-1 ml-6 self-center mb-[5px]">
        {onResetLayout && (
          <button 
            onClick={onResetLayout}
            className="flex items-center text-sm px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors mr-1"
            title="手动重置脑图、大纲及各种窗格的大小和长宽为默认"
          >
            <LayoutGrid className="w-4 h-4 mr-1 text-blue-600" />
            重置布局
          </button>
        )}
        <button 
          onClick={onOpenLibrary}
          className="flex items-center text-sm px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          title="库文件"
        >
          <Library className="w-4 h-4 mr-1.5 text-indigo-600" />
          库文件
        </button>
        <button 
          onClick={onOpenSettings}
          className="flex items-center text-sm px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4 mr-1" />
          设置
        </button>
        <button 
          onClick={onOpenTheme}
          className="p-1.5 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-md transition-colors"
          title="个性化外观"
        >
          <Shirt className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
