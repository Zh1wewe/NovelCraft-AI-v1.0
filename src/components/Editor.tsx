import React, { useState, useRef, useEffect } from 'react';
import { PenTool, MessageSquarePlus, MessageCircleQuestion, ArrowLeft, Send } from 'lucide-react';
import { Chapter } from '../types';

interface EditorProps {
  chapter: Chapter;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onTriggerRewrite?: (selectedText: string, rangeInfo: { start: number; end: number }) => void;
  onTriggerDiscuss?: (selectedText: string, rangeInfo: { start: number; end: number }, userCritique: string) => void;
  onTriggerQuery?: (selectedText: string, rangeInfo: { start: number; end: number }) => void;
  style?: React.CSSProperties;
}

export const Editor: React.FC<EditorProps> = ({ 
  chapter, 
  onUpdateChapter, 
  onTriggerRewrite, 
  onTriggerDiscuss, 
  onTriggerQuery, 
  style 
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  
  // Selection details
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  
  // Discussion sub-state within the toolbar
  const [showDiscussInput, setShowDiscussInput] = useState(false);
  const [discussValue, setDiscussValue] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const contentDivRef = useRef<HTMLDivElement>(null);

  // Helper: Get exact text selection character range relative to content editable container
  const getSelectionCharacterOffsetWithin = (element: HTMLElement) => {
    let start = 0;
    let end = 0;
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || window;
    const sel = win.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      start = preCaretRange.toString().length;
      end = start + range.toString().length;
    }
    return { start, end };
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '' && contentDivRef.current) {
      const { start, end } = getSelectionCharacterOffsetWithin(contentDivRef.current);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (editorRect) {
        setToolbarPosition({
          top: rect.top - editorRect.top - 45, // Position above selection
          left: rect.left - editorRect.left + (rect.width / 2) - 130, // Center roughly
        });
        setSelectedText(selection.toString());
        setSelectionRange({ start, end });
        setShowDiscussInput(false); // Reset sub-state
        setDiscussValue('');
        setShowToolbar(true);
      }
    } else {
      // Don't close immediately so clicking toolbar won't trigger exit unless clicking elsewhere
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        setShowDiscussInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRewrite = () => {
    if (onTriggerRewrite && selectedText.trim() !== '') {
      onTriggerRewrite(selectedText, selectionRange);
      setShowToolbar(false);
    }
  };

  const handleDiscussClick = () => {
    setShowDiscussInput(true);
  };

  const handleDiscussSubmit = () => {
    if (onTriggerDiscuss && selectedText.trim() !== '' && discussValue.trim() !== '') {
      onTriggerDiscuss(selectedText, selectionRange, discussValue.trim());
      setShowToolbar(false);
      setShowDiscussInput(false);
      setDiscussValue('');
    }
  };

  const handleQuery = () => {
    if (onTriggerQuery && selectedText.trim() !== '') {
      onTriggerQuery(selectedText, selectionRange);
      setShowToolbar(false);
    }
  };

  return (
    <div className="flex-1 bg-white/70 relative flex flex-col h-full overflow-hidden" ref={editorRef} style={style}>
      <div className="p-3 border-b border-gray-200/50">
        <span className="text-sm font-semibold tracking-wider text-gray-500">正文内容</span>
      </div>
      
      <div 
        className="flex-1 p-8 outline-none overflow-y-auto font-sans leading-relaxed text-gray-900 text-lg selection:bg-blue-200 selection:text-blue-900 whitespace-pre-wrap"
        onMouseUp={handleMouseUp}
      >
        <h1 
          className="text-3xl font-bold mb-8 text-gray-900 outline-none"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdateChapter(chapter.id, { title: e.currentTarget.textContent || '无标题' })}
        >
          {chapter.title}
        </h1>
        <div 
          ref={contentDivRef}
          className="outline-none min-h-[400px]"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            // Note: innerText has the exact multiline plaintext of the div block
            onUpdateChapter(chapter.id, { content: e.currentTarget.innerText || '' });
          }}
        >
          {chapter.content}
        </div>
      </div>

      {showToolbar && (
        <div 
          className="absolute z-10 bg-gray-900 border border-gray-700 shadow-xl rounded-lg py-1 px-1 flex flex-col select-none animate-in fade-in zoom-in duration-200 min-w-[260px]"
          style={{ 
            top: Math.max(10, toolbarPosition.top), 
            left: Math.max(10, toolbarPosition.left) 
          }}
          onMouseDown={(e) => e.preventDefault()} // Critical: Prevents contentEditable from losing selection & focus!
        >
          {!showDiscussInput ? (
            <div className="flex items-center space-x-1 p-1">
              <button 
                onClick={handleRewrite}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-white hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300" />
                <span>重写</span>
              </button>
              <div className="w-px h-4 bg-gray-700"></div>
              <button 
                onClick={handleDiscussClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-white hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-green-400 group-hover:text-green-300" />
                <span>讨论</span>
              </button>
              <div className="w-px h-4 bg-gray-700"></div>
              <button 
                onClick={handleQuery}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-white hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              >
                <MessageCircleQuestion className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-300" />
                <span>疑问</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 p-1 w-[320px] bg-gray-900 rounded-lg">
              <button 
                onClick={() => setShowDiscussInput(false)}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors cursor-pointer animate-none"
                title="返回"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                placeholder="输入见解疑问或情节脑洞..."
                value={discussValue}
                onChange={(e) => setDiscussValue(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDiscussSubmit();
                  }
                }}
              />
              <button
                onClick={handleDiscussSubmit}
                disabled={discussValue.trim() === ''}
                className="px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-[11px] rounded font-semibold flex items-center gap-0.5 shrink-0 transition-all cursor-pointer"
              >
                <span>讨论</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
