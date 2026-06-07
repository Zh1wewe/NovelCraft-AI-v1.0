import React, { useState } from 'react';
import { Globe, MapPin, Clock, Plus, Trash2, ShieldAlert, BookOpen, RotateCcw } from 'lucide-react';
import { BackgroundSetting } from '../types';

interface BackgroundViewProps {
  background: BackgroundSetting;
  onUpdateBackground: (updates: Partial<BackgroundSetting>) => void;
  onRollbackLog?: (logId: string) => void;
  style?: React.CSSProperties;
}

export const BackgroundView: React.FC<BackgroundViewProps> = ({ background, onUpdateBackground, onRollbackLog, style }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'rules' | 'geography' | 'logs'>('timeline');

  const addTimelineEvent = () => {
    const oldTimeline = [...background.timeline];
    const newEvent = { id: `tl-${Date.now()}`, year: '新年份', event: '新事件' };
    const newTimeline = [...oldTimeline, newEvent];
    
    // Save to logs
    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      actionType: 'timeline_add' as const,
      description: `手动添加大事记: ${newEvent.year}`,
      preState: { timeline: oldTimeline },
      postState: { timeline: newTimeline }
    };

    onUpdateBackground({
      timeline: newTimeline,
      historyLogs: [newLog, ...(background.historyLogs || [])]
    });
  };

  const updateTimelineEvent = (id: string, updates: Partial<{year: string; event: string}>) => {
    const oldTimeline = [...background.timeline];
    const newTimeline = background.timeline.map(t => t.id === id ? { ...t, ...updates } : t);
    const updatedItem = background.timeline.find(t => t.id === id);
    
    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      actionType: 'timeline_modify' as const,
      description: `更新纪事线 [${updatedItem?.year || ''}] 设定内容`,
      preState: { timeline: oldTimeline },
      postState: { timeline: newTimeline }
    };

    onUpdateBackground({
      timeline: newTimeline,
      historyLogs: [newLog, ...(background.historyLogs || [])]
    });
  };

  const deleteTimelineEvent = (id: string) => {
    const oldTimeline = [...background.timeline];
    const deletedItem = background.timeline.find(t => t.id === id);
    const newTimeline = background.timeline.filter(t => t.id !== id);
    
    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      actionType: 'timeline_delete' as const,
      description: `手动删除大事记: ${deletedItem?.year || '未知年份'}`,
      preState: { timeline: oldTimeline },
      postState: { timeline: newTimeline }
    };

    onUpdateBackground({
      timeline: newTimeline,
      historyLogs: [newLog, ...(background.historyLogs || [])]
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/70 overflow-hidden" style={style}>
      <div className="p-4 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-650" />
          <h2 className="text-lg font-bold text-gray-800">世界构建</h2>
        </div>
        
        {/* Subtab selection */}
        <div className="flex bg-gray-150/80 p-0.5 rounded-lg text-xs font-semibold text-gray-600 gap-1 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${activeSubTab === 'timeline' ? 'bg-white text-purple-750 shadow-sm font-bold' : 'hover:text-gray-900 hover:bg-white/30'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            纪事编年表
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${activeSubTab === 'rules' ? 'bg-white text-purple-750 shadow-sm font-bold' : 'hover:text-gray-900 hover:bg-white/30'}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            核心法则约束
          </button>
          <button
            onClick={() => setActiveSubTab('geography')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${activeSubTab === 'geography' ? 'bg-white text-purple-750 shadow-sm font-bold' : 'hover:text-gray-900 hover:bg-white/30'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            地理环境环境
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${activeSubTab === 'logs' ? 'bg-white text-purple-750 shadow-sm font-bold font-semibold' : 'hover:text-gray-900 hover:bg-white/30'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            小说底色日志
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {activeSubTab === 'timeline' && (
          <div className="flex-1 bg-white/80 border border-white/50 backdrop-blur-sm rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-800">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-lg">纪事编年表</h3>
              </div>
              <button 
                onClick={addTimelineEvent}
                className="flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-md hover:bg-purple-100 transition-colors"
               >
                <Plus className="w-4 h-4" /> 添加事件
               </button>
            </div>
            <div className="ml-2 border-l-2 border-purple-200 pl-4 py-2 space-y-4">
              {background.timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="flex items-baseline justify-between mb-1">
                    <div 
                      className="text-sm font-bold text-gray-800 outline-none hover:bg-white/50 px-1 -mx-1 rounded"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateTimelineEvent(item.id, { year: e.currentTarget.innerText })}
                    >
                      {item.year}
                    </div>
                    <button 
                      onClick={() => deleteTimelineEvent(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div 
                    className="text-sm text-gray-600 outline-none hover:bg-white/50 p-1 -mx-1 rounded whitespace-pre-wrap"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateTimelineEvent(item.id, { event: e.currentTarget.innerText })}
                  >
                    {item.event}
                  </div>
                </div>
              ))}
              {background.timeline.length === 0 && (
                <div className="text-gray-400 text-sm">还没有记录纪事，请点击右上角添加。</div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'rules' && (
          <div className="flex-1 bg-white/85 border border-white/50 backdrop-blur-sm rounded-xl p-5 shadow-sm flex flex-col gap-3 min-h-[350px]">
            <div className="flex items-center gap-2 text-purple-850">
              <ShieldAlert className="w-5 h-5 text-purple-650" />
              <h3 className="font-bold text-lg">核心世界观与物理由法则约束</h3>
            </div>
            <p className="text-xs text-gray-500">
              记录该世界最底层的根本规则（如魔法体系、高维入侵等级、物理守恒常数改变等），AI 创作正文时将自觉遵循。
            </p>
            <textarea
              value={background.worldRules || ''}
              onChange={(e) => {
                const oldRules = background.worldRules || '';
                onUpdateBackground({ 
                  worldRules: e.target.value
                });
              }}
              onBlur={(e) => {
                // Save audit log only on focus loss to prevent intensive log noise
                const oldRules = background.worldRules || '';
                if (oldRules === e.target.value) return;
                const newLog = {
                  id: `log-${Date.now()}-${Math.random()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  actionType: 'world_rules_update' as const,
                  description: `手动更新了世界核心法则守则`,
                  preState: { worldRules: oldRules },
                  postState: { worldRules: e.target.value }
                };
                onUpdateBackground({
                  historyLogs: [newLog, ...(background.historyLogs || [])]
                });
              }}
              placeholder="请描述该世界的根本守则、物理与法术规则约束..."
              className="flex-1 w-full p-4 border border-gray-150 rounded-xl focus:ring-2 focus:ring-purple-250 focus:outline-none text-sm text-gray-700 bg-white/60 leading-relaxed outline-none resize-none"
            />
          </div>
        )}

        {activeSubTab === 'geography' && (
          <div className="flex-1 bg-white/85 border border-white/50 backdrop-blur-sm rounded-xl p-5 shadow-sm flex flex-col gap-3 min-h-[350px]">
            <div className="flex items-center gap-2 text-purple-850">
              <MapPin className="w-5 h-5 text-purple-650" />
              <h3 className="font-bold text-lg">地理环境、城市舆图与疆界</h3>
            </div>
            <p className="text-xs text-gray-500">
              记录各城邦、荒野禁区、神秘遗迹的经纬与方位，方便在小说推进中维持高时空实感。
            </p>
            <textarea
              value={background.geography || ''}
              onChange={(e) => {
                onUpdateBackground({ geography: e.target.value });
              }}
              onBlur={(e) => {
                // Save audit log only on focus loss
                const oldGeo = background.geography || '';
                if (oldGeo === e.target.value) return;
                const newLog = {
                  id: `log-${Date.now()}-${Math.random()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  actionType: 'geography_update' as const,
                  description: `手动编辑更新了地理环境与城市分布图谱`,
                  preState: { geography: oldGeo },
                  postState: { geography: e.target.value }
                };
                onUpdateBackground({
                  historyLogs: [newLog, ...(background.historyLogs || [])]
                });
              }}
              placeholder="请输入地理地貌、城邦分布或神秘绝地分布..."
              className="flex-1 w-full p-4 border border-gray-150 rounded-xl focus:ring-2 focus:ring-purple-250 focus:outline-none text-sm text-gray-700 bg-white/60 leading-relaxed outline-none resize-none"
            />
          </div>
        )}

        {activeSubTab === 'logs' && (
          <div className="flex-1 bg-white/80 border border-white/50 backdrop-blur-sm rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-purple-800">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-bold text-lg">世界构建变更日记</h3>
            </div>
            <p className="text-xs text-gray-500">
              保存了 AI 修正或手动修正的世界设定变更。在这里用户可以追溯变更，亦可随时“撤回”或“还原”任何一步。
            </p>
            
            <div className="space-y-3 mt-2">
              {(!background.historyLogs || background.historyLogs.length === 0) ? (
                <div className="text-gray-400 text-sm text-center py-12">
                  您还没有任何构建行为变更，AI 对世界构建的每一次应用修改都会记录在此。
                </div>
              ) : (
                background.historyLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50/70 border border-gray-150 rounded-lg flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 font-mono">[{log.timestamp}]</span>
                        <span className="text-xs font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">
                          {log.actionType === 'timeline_add' && '大事新增'}
                          {log.actionType === 'timeline_modify' && '大事修改'}
                          {log.actionType === 'timeline_delete' && '大事删除'}
                          {log.actionType === 'world_rules_update' && '核心法理更新'}
                          {log.actionType === 'geography_update' && '地理舆图更新'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{log.description}</p>
                    </div>
                    {onRollbackLog && (
                      <button
                        onClick={() => onRollbackLog(log.id)}
                        className="flex items-center gap-1 text-xs text-xs font-semibold px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors rounded border border-red-200/50"
                        title="撤回本步操作，还原为变动前状态"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>撤回</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
