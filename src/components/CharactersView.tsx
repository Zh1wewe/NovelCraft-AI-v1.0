import React, { useState } from 'react';
import { CharacterProfile } from '../types';
import { Plus, Search, User, Edit3, Trash2, X, Check } from 'lucide-react';

interface CharactersViewProps {
  characters: CharacterProfile[];
  onAddCharacter: () => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onDeleteCharacter: (id: string) => void;
  style?: React.CSSProperties;
}

export const CharactersView: React.FC<CharactersViewProps> = ({ characters, onAddCharacter, onUpdateCharacter, onDeleteCharacter, style }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);
  const [editedDescription, setEditedDescription] = useState('');

  const filteredCharacters = characters.filter(c => 
    c.name.includes(searchTerm) || c.role.includes(searchTerm) || c.description.includes(searchTerm)
  );

  const handleOpenEdit = (char: CharacterProfile) => {
    setEditingCharacter(char);
    setEditedDescription(char.description);
  };

  const handleSaveEdit = () => {
    if (editingCharacter) {
      onUpdateCharacter(editingCharacter.id, { description: editedDescription });
      setEditingCharacter(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/70 overflow-hidden relative" style={style}>
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">人文设定</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索角色..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white/50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
            />
          </div>
        </div>
        <button 
          onClick={onAddCharacter}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> 新建角色
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="columns-1 lg:columns-2 xl:columns-3 gap-6 space-y-6">
          {filteredCharacters.map(char => {
            return (
              <div 
                key={char.id} 
                className="break-inside-avoid relative group rounded-xl p-5 shadow-sm hover:shadow-md transition-all border bg-slate-50 border-slate-200"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(char)}
                    className="p-1 hover:bg-blue-500/10 hover:text-blue-600 rounded text-slate-400 transition-colors cursor-pointer"
                    title="阅读与编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteCharacter(char.id)}
                    className="p-1 hover:bg-red-500/10 hover:text-red-600 rounded text-slate-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden">
                    {char.avatar ? (
                      <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <div className="pr-12">
                    <h3 
                      className="text-lg font-bold text-gray-900 outline-none focus:bg-white/80 rounded transition-colors"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCharacter(char.id, { name: e.currentTarget.textContent || 'Unnamed' })}
                    >
                      {char.name}
                    </h3>
                    <span 
                      className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mt-1 outline-none focus:bg-white/80 transition-colors"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCharacter(char.id, { role: e.currentTarget.textContent || '' })}
                    >
                      {char.role}
                    </span>
                  </div>
                </div>
                
                <div 
                  className="mt-4 text-sm text-slate-700 leading-relaxed transition-colors relative z-0 cursor-pointer line-clamp-6 pb-1 whitespace-pre-wrap"
                  onClick={() => handleOpenEdit(char)}
                  title="点击查看详细信息或编辑"
                >
                  {char.description}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {char.traits?.map((trait, idx) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100/50">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCharacters.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p>没有找到相关角色</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      {editingCharacter && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  {editingCharacter.avatar ? (
                    <img src={editingCharacter.avatar} alt={editingCharacter.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{editingCharacter.name}</h3>
                  <div className="text-xs text-gray-500">{editingCharacter.role}</div>
                </div>
              </div>
              <button 
                onClick={() => setEditingCharacter(null)}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">身世背景与设定</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full flex-1 min-h-[300px] sm:min-h-[400px] resize-none outline-none text-gray-700 leading-relaxed text-sm p-3 bg-gray-50/50 rounded-lg focus:bg-white border border-transparent focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all font-mono whitespace-pre-wrap"
                placeholder="在这记录角色的详细设定..."
              />
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setEditingCharacter(null)}
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
