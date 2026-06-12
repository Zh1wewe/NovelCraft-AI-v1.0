import React, { useState } from 'react';
import { InspirationNote } from '../types';
import { Plus, Trash2, Edit3, X, Check } from 'lucide-react';

interface NotesViewProps {
  notes: InspirationNote[];
  onAddNote: () => void;
  onUpdateNote: (id: string, updates: Partial<InspirationNote>) => void;
  onDeleteNote: (id: string) => void;
  style?: React.CSSProperties;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, style }) => {
  const [editingNote, setEditingNote] = useState<InspirationNote | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const handleOpenEdit = (note: InspirationNote) => {
    setEditingNote(note);
    setEditedContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingNote) {
      onUpdateNote(editingNote.id, { content: editedContent });
      setEditingNote(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/70 overflow-hidden relative" style={style}>
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/40">
        <h2 className="text-lg font-bold text-gray-800">灵感小记</h2>
        <button 
          onClick={onAddNote}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> 记录灵感
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="columns-1 lg:columns-2 xl:columns-3 gap-6 space-y-6">
          {notes.map(note => {
            return (
              <div 
                key={note.id} 
                className={`break-inside-avoid relative group rounded-xl p-5 shadow-sm hover:shadow-md transition-all border bg-slate-50 border-slate-200`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-slate-400 font-medium tracking-wide">{new Date(note.createdAt).toLocaleDateString()}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(note)}
                      className="p-1 hover:bg-blue-500/10 hover:text-blue-600 rounded text-slate-400 transition-colors cursor-pointer"
                      title="阅读与编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 hover:bg-red-500/10 hover:text-red-600 rounded text-slate-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap transition-colors relative z-0 cursor-pointer line-clamp-6 pb-1"
                  onClick={() => handleOpenEdit(note)}
                  title="点击查看详细信息或编辑"
                >
                  {note.content}
                </div>
              </div>
            );
          })}
        </div>
        
        {notes.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>暂无灵感，快去和 AI 讨论产生火花吧！</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">阅读与编辑灵感</h3>
              <button 
                onClick={() => setEditingNote(null)}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full min-h-[300px] sm:min-h-[400px] resize-none outline-none text-gray-700 leading-relaxed text-sm p-2 bg-gray-50/50 rounded-lg focus:bg-white border border-transparent focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all font-mono whitespace-pre-wrap"
                placeholder="在这记录您的灵感..."
              />
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" /> 确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
