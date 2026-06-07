import React, { useState } from 'react';
import { Send, Check, X, ThumbsUp, Trash2, Bot, User, Sparkles, DatabaseZap } from 'lucide-react';
import { ChatMessage } from '../types';

// Parses tool call arguments from AI output block
const getToolCallDetails = (content: string) => {
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

// Parses and beautifies detailed rewrite or critique prompts for user messages
const renderUserMessage = (content: string) => {
  if (content.startsWith('【重写请求】')) {
    const textMatch = content.match(/选中的文字：“([\s\S]*?)”/);
    const rangeMatch = content.match(/字数范围：(.*)/);
    const textSel = textMatch ? textMatch[1] : '';
    const rangeSel = rangeMatch ? rangeMatch[1] : '';
    return (
      <div className="space-y-1 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-xl p-3.5 text-gray-800 shadow-sm w-full max-w-sm font-sans">
        <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs select-none">
          <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-sans">✍️</span>
          <span>主笔润色重写申请</span>
        </div>
        <div className="border-l-2 border-blue-400 pl-3 italic text-gray-600 my-2 text-xs bg-white/40 py-1 rounded-r leading-relaxed">
          “{textSel}”
        </div>
        {rangeSel && <div className="text-[10px] text-gray-400/80 font-bold select-none uppercase tracking-wider">{rangeSel}</div>}
      </div>
    );
  }

  if (content.startsWith('【情节讨论与意见见解】')) {
    const textMatch = content.match(/选中的文字：“([\s\S]*?)”/);
    const critiqueMatch = content.match(/作者的想法与见解：“([\s\S]*?)”/);
    const textSel = textMatch ? textMatch[1] : '';
    const critiqueSel = critiqueMatch ? critiqueMatch[1] : '';
    return (
      <div className="space-y-1 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 border border-teal-200/50 rounded-xl p-3.5 text-gray-800 shadow-sm w-full max-w-sm font-sans">
        <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs select-none">
          <span className="flex items-center justify-center w-5 h-5 bg-teal-100 text-teal-800 rounded-full text-[11px]">💬</span>
          <span>情节创意深度研讨</span>
        </div>
        <div className="border-l-2 border-teal-450 pl-3 italic text-gray-600 my-2 text-xs bg-white/40 py-1 rounded-r leading-relaxed">
          选中的文字：“{textSel}”
        </div>
        <div className="text-xs text-gray-750 bg-white/60 rounded-lg p-2 border border-teal-120/40 mt-1">
          <span className="font-bold text-[10px] text-teal-600 block uppercase mb-1">💡 创意想法/讨论见解:</span>
          <span className="leading-relaxed font-medium">{critiqueSel || '（探讨此段落的情感和发展倾向）'}</span>
        </div>
      </div>
    );
  }

  if (content.startsWith('【情节逻辑疑问解答】')) {
    const textMatch = content.match(/选中的文字：“([\s\S]*?)”/);
    const questionMatch = content.match(/疑问与困惑：“([\s\S]*?)”/);
    const textSel = textMatch ? textMatch[1] : '';
    const questionSel = questionMatch ? questionMatch[1] : '';
    return (
      <div className="space-y-1 bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/50 rounded-xl p-3.5 text-gray-800 shadow-sm w-full max-w-sm font-sans">
        <div className="flex items-center gap-1.5 text-orange-700 font-bold text-xs select-none">
          <span className="flex items-center justify-center w-5 h-5 bg-orange-100 text-orange-850 rounded-full text-[11px]">❓</span>
          <span>正文情节逻辑质疑解惑</span>
        </div>
        <div className="border-l-2 border-orange-400 pl-3 italic text-gray-600 my-2 text-xs bg-white/40 py-1 rounded-r leading-relaxed">
          针对文段：“{textSel}”
        </div>
        {questionSel && (
          <div className="text-xs text-gray-755 bg-white/60 rounded-lg p-2 border border-orange-100 mt-1">
            <span className="font-bold text-[10px] text-orange-600 block uppercase mb-1">🔍 疑问及困惑详情:</span>
            <span className="leading-relaxed font-medium">{questionSel}</span>
          </div>
        )}
      </div>
    );
  }

  return <div className="whitespace-pre-wrap leading-relaxed break-all break-words">{content}</div>;
};

// Parses and cleans AI responses to strip <args>...</args> and display premium rewrite highlights
const renderAssistantMessage = (content: string) => {
  const isReplace = content.includes('replace_chapter_text');
  const argsMatch = content.match(/<args>([\s\S]*?)<\/args>/);

  if (isReplace && argsMatch) {
    try {
      let argsStr = argsMatch[1];
      argsStr = argsStr.replace(/^\s*```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
      const parsed = JSON.parse(argsStr);
      if (parsed.action === 'replace_chapter_text') {
        const textBeforeArgs = content.replace(/<args>[\s\S]*?<\/args>/g, '').trim();
        const shortCommentary = textBeforeArgs.length > 200 ? textBeforeArgs.slice(0, 200) + '...' : textBeforeArgs;

        return (
          <div className="space-y-3 font-sans w-full leading-relaxed">
            {shortCommentary && (
              <div className="text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2 italic">
                {shortCommentary}
              </div>
            )}
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50/45 border border-purple-200/70 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-purple-800 text-xs mb-2.5 select-none">
                <span className="text-sm">✨</span>
                <span>AI 智能主笔精修方案已就绪</span>
              </div>
              
              <div className="space-y-2 text-xs">
                {parsed.oldText && (
                  <div className="p-2 border border-red-100/50 rounded-lg bg-red-50/20">
                    <span className="font-bold text-[9px] text-red-500 uppercase block mb-1 tracking-wider">❌ 原文文段：</span>
                    <span className="text-gray-400 line-through select-none leading-relaxed tracking-wider font-serif">{parsed.oldText}</span>
                  </div>
                )}
                {parsed.newText && (
                  <div className="p-3 border border-green-200/60 rounded-lg bg-green-50/30 text-gray-850 shadow-inner">
                    <span className="font-bold text-[9px] text-green-700 uppercase block mb-1 tracking-wider">✨ AI 提议润色润饰：</span>
                    <span className="leading-relaxed tracking-wider font-medium text-sm font-serif block mt-1 py-0.5 text-gray-800">{parsed.newText}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    } catch (e) {
      console.warn("Parse edit tool-call args fails in chat view:", e);
    }
  }

  // General chat outcome - filter out any <args>...</args> completely, so UI remains completely pure
  const cleanContent = content.replace(/<args>[\s\S]*?<\/args>/g, '').trim();
  return <div className="whitespace-pre-wrap leading-relaxed break-all break-words">{cleanContent}</div>;
};

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onAdoptProposal?: (type: string, content: string) => void;
  currentContext?: string[];
  style?: React.CSSProperties;
  currentModel?: string;
  onModelChange?: (model: string) => void;
  globalModel?: string;
  connectedModels?: string[];
  tabId: string;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  conceptMode?: 'prompt' | 'image';
  onConceptModeChange?: (mode: 'prompt' | 'image') => void;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  onSendMessage, 
  onAdoptProposal, 
  currentContext = [], 
  style,
  currentModel,
  onModelChange,
  globalModel,
  connectedModels = [],
  tabId,
  isGenerating = false,
  onStopGeneration,
  conceptMode = 'image',
  onConceptModeChange
}) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const inputValue = drafts[tabId] || '';
  const setInputValue = (val: string) => {
    setDrafts(prev => ({
      ...prev,
      [tabId]: val
    }));
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    if (!userHasScrolled && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, userHasScrolled]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/50" style={style}>
      <div className="p-3 border-b border-gray-200/50 flex flex-col gap-2 bg-white/40">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-gray-700 flex items-center gap-1.5 select-none">
            <Sparkles className="w-4 h-4 text-purple-605 text-purple-600" />
            AI 对话辅助
          </h2>
          
          {/* AI助手的模型选择功能栏 */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium select-none">专属模型:</span>
            <select
              value={currentModel || ''}
              onChange={(e) => onModelChange?.(e.target.value)}
              className="text-[11px] font-bold border border-purple-200/50 bg-white/90 rounded px-1 py-0.5 text-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-400 max-w-[130px] truncate select-none cursor-pointer"
              title="设置此页面专属绑定的 AI 模型"
            >
              <option value="">（跟随全局）</option>
              <option value="deepseek-chat">
                DeepSeek {connectedModels?.includes('deepseek-chat') ? '✓已连' : ' (未连)'}
              </option>
              <option value="moonshot-v1-8k">
                Kimi Chat {connectedModels?.includes('moonshot-v1-8k') ? '✓已连' : ' (未连)'}
              </option>
              <option value="qwen-turbo">
                Qwen {connectedModels?.includes('qwen-turbo') ? '✓已连' : ' (未连)'}
              </option>
              <option value="glm-4-flash">
                GLM Flash {connectedModels?.includes('glm-4-flash') ? '✓已连' : ' (未连)'}
              </option>
              <option value="gpt-4o-mini">
                GPT Mini {connectedModels?.includes('gpt-4o-mini') ? '✓已连' : ' (未连)'}
              </option>
              {globalModel && !['deepseek-chat', 'moonshot-v1-8k', 'qwen-turbo', 'glm-4-flash', 'gpt-4o-mini'].includes(globalModel) && (
                <option value={globalModel}>
                  {globalModel} {connectedModels?.includes(globalModel) ? '✓已连' : ' (未连)'}
                </option>
              )}
            </select>
          </div>
        </div>
        
        {currentContext.length > 0 && (
          <div className="flex items-start gap-1.5 mt-1">
            <DatabaseZap className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {currentContext.map((ctx, idx) => (
                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-purple-100/50 text-purple-700 border border-purple-200/50 rounded">
                  {ctx}
                </span>
              ))}
            </div>
          </div>
        )}

        {tabId === 'concept' && (
          <div className="flex items-center justify-between p-1 bg-purple-50/50 rounded-lg border border-purple-100/60 mt-1 select-none text-[11px]">
            <span className="text-purple-700 font-medium pl-1">文生图AI模式:</span>
            <div className="flex bg-purple-100/30 p-0.5 rounded-md w-[170px] border border-purple-200/30">
              <button
                type="button"
                onClick={() => onConceptModeChange?.('prompt')}
                className={`flex-1 py-0.5 text-[10.5px] rounded-sm text-center font-bold transition-all cursor-pointer ${
                  conceptMode === 'prompt'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-purple-550 text-purple-500 hover:text-purple-800'
                }`}
              >
                提示词模式
              </button>
              <button
                type="button"
                onClick={() => onConceptModeChange?.('image')}
                className={`flex-1 py-0.5 text-[10.5px] rounded-sm text-center font-bold transition-all cursor-pointer ${
                  conceptMode === 'image'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-purple-550 text-purple-500 hover:text-purple-800'
                }`}
              >
                直接生成图片
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => {
          if (msg.role === 'system') {
            const isUndoable = msg.content.includes('🔄 已撤回') || (msg.content.includes('✅') && (msg.content.includes('已成功') || msg.content.includes('已完成') || msg.content.includes('已一键生效') || msg.content.includes('已更新') || msg.content.includes('融入并保存') || msg.content.includes('主笔精修')));
            return (
              <div key={msg.id} className="flex flex-col items-center justify-center my-2 gap-1 px-2 w-full">
                <span className="bg-gray-100/90 text-gray-600 text-[11px] px-3 py-1.5 rounded-xl font-medium shadow-sm backdrop-blur-sm border border-gray-200/50 text-center max-w-[95%]">
                  {msg.content}
                  {isUndoable && !msg.content.includes('已撤回') && (
                    <button
                      onClick={() => onAdoptProposal?.('rollback_last', msg.id)}
                      className="ml-2 text-red-600 hover:text-red-800 hover:underline font-bold border-l pl-2 border-gray-300 cursor-pointer"
                    >
                      撤回
                    </button>
                  )}
                </span>
              </div>
            );
          }

          const hasSpecialLayout = msg.role === 'user' 
            ? msg.content.startsWith('【') 
            : msg.content.includes('replace_chapter_text');

          return (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center space-x-2 mb-1">
              {msg.role === 'assistant' && <Bot className="w-4 h-4 text-purple-600" />}
              <span className="text-xs font-medium text-gray-600">
                {msg.role === 'user' ? '作者' : '小说家AI'}
              </span>
              {msg.role === 'user' && <User className="w-4 h-4 text-blue-600" />}
            </div>
            
            <div className={`rounded-lg max-w-[90%] text-sm break-words overflow-wrap-anywhere ${
              hasSpecialLayout 
                ? 'bg-transparent shadow-none border-none p-0 w-full max-w-full' 
                : (msg.role === 'user' ? 'p-3 bg-blue-600 text-white shadow-sm font-sans' : 'p-3 bg-white/80 border border-white/50 text-gray-800 shadow-sm font-sans')
            }`}>
              {msg.role === 'user' ? renderUserMessage(msg.content) : renderAssistantMessage(msg.content)}
            </div>

            {msg.type === 'outline_proposal' && msg.role === 'assistant' && (
              <div className="flex items-center space-x-2 mt-2 self-start ml-2">
                <button 
                  onClick={() => onAdoptProposal?.('outline', msg.content)}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-100/80 text-green-700 hover:bg-green-200/80 rounded shadow-sm text-xs font-medium transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>采纳并入图</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 bg-red-100/80 text-red-700 hover:bg-red-200/80 rounded shadow-sm text-xs font-medium transition-colors">
                  <X className="w-3.5 h-3.5" />
                  <span>打回修改</span>
                </button>
              </div>
            )}

            {(msg.type === 'tool_call' || msg.content.includes('replace_chapter_text')) && msg.role === 'assistant' && (
              <div className="flex flex-col gap-2 mt-2 self-start p-3 bg-blue-50/80 rounded-xl border border-blue-100/50 w-full max-w-[92%] shadow-sm">
                {msg.proposalStatus === 'adopted' ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      已成功采纳并一键执行修改
                    </span>
                    <button
                      onClick={() => onAdoptProposal?.('rollback_last', msg.id, msg.id)}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline font-bold border-l pl-2 border-gray-300 cursor-pointer"
                    >
                      撤回
                    </button>
                  </div>
                ) : msg.proposalStatus === 'declined' ? (
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-1 py-1">
                    <X className="w-4 h-4 text-gray-400" />
                    此修改提案已被拒绝或撤销
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-blue-700 font-bold">
                      {(() => {
                        const toolArgs = getToolCallDetails(msg.content);
                        if (toolArgs) {
                          if (toolArgs.action === 'edit_library_file') {
                            return `请确认：修改本地物理库文件 "${toolArgs.filePath}"`;
                          }
                          if (toolArgs.action === 'read_library_file') {
                            return `请确认：提取物理文件 "${toolArgs.filePath}" 内容`;
                          }
                          if (toolArgs.action === 'search_library_files') {
                            return `请确认：搜索本地文件夹 "${toolArgs.query || '所有数据'}"`;
                          }
                        }
                        return '请执行操作：对大纲或章节内容进行一键编排';
                      })()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onAdoptProposal?.('tool_call', msg.content, msg.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>确认执行修改</span>
                      </button>
                      <button 
                        onClick={() => onAdoptProposal?.('decline_proposal', '', msg.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-150 hover:bg-gray-250 text-gray-700 rounded-lg shadow-sm text-xs font-bold transition-colors border border-gray-205 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>取消此修改</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {msg.type === 'evaluation' && msg.role === 'assistant' && (
              <div className="flex items-center space-x-2 mt-2 self-start ml-2 border-t border-gray-200/50 pt-2 w-full justify-between">
                 <span className="text-xs text-gray-500 font-medium">评价此灵感：</span>
                 <div className="flex space-x-1">
                    <button className="p-1 hover:bg-white/80 rounded group transition-colors shadow-sm" title="采纳并入库">
                       <ThumbsUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-white/80 rounded group transition-colors shadow-sm" title="丢弃至垃圾箱">
                       <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" />
                    </button>
                 </div>
              </div>
            )}
          </div>
        )})}
      </div>

      <div className="p-4 border-t border-gray-200/50 bg-white/40">
        {isGenerating && (
          <div className="flex justify-center mb-2 animate-fade-in select-none">
            <button
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 text-red-600 border border-red-200 rounded-full text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>中断 AI 思考</span>
            </button>
          </div>
        )}
        <div className="relative animate-fade-in">
          <textarea 
            placeholder="输入需求（回车发送，Shift+回车换行）..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-lg border border-gray-200/80 bg-white/80 backdrop-blur-sm pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
