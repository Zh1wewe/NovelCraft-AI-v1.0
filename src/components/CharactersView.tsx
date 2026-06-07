import React, { useState } from 'react';
import { CharacterProfile } from '../types';
import { Plus, Search, User, Edit3, Trash2 } from 'lucide-react';

interface CharactersViewProps {
  characters: CharacterProfile[];
  onAddCharacter: () => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onDeleteCharacter: (id: string) => void;
  style?: React.CSSProperties;
}

export const CharactersView: React.FC<CharactersViewProps> = ({ characters, onAddCharacter, onUpdateCharacter, onDeleteCharacter, style }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCharacters = characters.filter(c => 
    c.name.includes(searchTerm) || c.role.includes(searchTerm) || c.description.includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white/70 overflow-hidden" style={style}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCharacters.map(char => (
            <div key={char.id} className="bg-white/80 border border-white/50 backdrop-blur-sm rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={() => onDeleteCharacter(char.id)}
                  className="p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-md text-gray-500 transition-colors"
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
                <div>
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
              
              <p 
                className="mt-4 text-sm text-gray-600 leading-relaxed outline-none focus:bg-white/80 p-2 -mx-2 rounded transition-colors"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCharacter(char.id, { description: e.currentTarget.textContent || '' })}
              >
                {char.description}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {char.traits.map((trait, idx) => (
                  <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100/50">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {filteredCharacters.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p>没有找到相关角色</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
