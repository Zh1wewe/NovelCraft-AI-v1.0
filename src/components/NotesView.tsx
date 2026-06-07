import React from 'react';
import { InspirationNote } from '../types';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';

interface NotesViewProps {
  notes: InspirationNote[];
  onAddNote: () => void;
  onUpdateNote: (id: string, updates: Partial<InspirationNote>) => void;
  onDeleteNote: (id: string) => void;
  style?: React.CSSProperties;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, style }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white/70 overflow-hidden" style={style}>
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/40">
        <h2 className="text-lg font-bold text-gray-800">灵感小记</h2>
        <button 
          onClick={onAddNote}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> 记录灵感
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
          {notes.map(note => {
            const bgColor = note.color || 'bg-yellow-50';
            const borderColor = note.color ? note.color.replace('bg-', 'border-').replace('50', '200') : 'border-yellow-200';
            
            return (
              <div 
                key={note.id} 
                className={`break-inside-avoid relative group rounded-xl p-5 shadow-sm hover:shadow-md transition-all border ${bgColor} ${borderColor}`}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <button className="p-1.5 hover:bg-black/5 rounded-md text-gray-500 cursor-move">
                    <GripHorizontal className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-600 rounded-md text-gray-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <p 
                  className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mt-2 outline-none focus:bg-white/50 p-2 -mx-2 rounded transition-colors relative z-0"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateNote(note.id, { content: e.currentTarget.textContent || '' })}
                >
                  {note.content}
                </p>
                
                <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-gray-400 font-medium">
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  <span>AI 已提取</span>
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
    </div>
  );
};
