import React from 'react';
import { File, FolderOpen, Plus } from 'lucide-react';
import { Chapter } from '../types';

interface ChapterSidebarProps {
  chapters: Chapter[];
  onChapterClick: (id: string) => void;
  onAddChapter: () => void;
  style?: React.CSSProperties;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({ chapters, onChapterClick, onAddChapter, style }) => {
  return (
    <div className="w-full border-r border-gray-200/50 flex flex-col h-full bg-white/50" style={style}>
      <div className="p-3 border-b border-gray-200/50 flex items-center justify-between bg-white/40">
        <h2 className="text-sm font-semibold tracking-wider text-gray-700">章节目录</h2>
        <button 
          onClick={onAddChapter}
          className="p-1 hover:bg-white/80 rounded text-gray-500 hover:text-black transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mt-1 space-y-1">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              onClick={() => onChapterClick(chapter.id)}
              className={`flex items-center space-x-2 p-2 text-sm rounded cursor-pointer transition-colors ${
                chapter.isActive ? 'bg-blue-100/70 text-blue-700 font-medium' : 'text-gray-700 hover:bg-white/60'
              }`}
            >
              <File className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <span className="truncate flex-1 pr-1 text-left">{chapter.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
