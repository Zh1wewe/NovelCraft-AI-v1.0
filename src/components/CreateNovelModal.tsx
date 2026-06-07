import React, { useState } from 'react';
import { X, BookPlus } from 'lucide-react';

interface CreateNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  canClose?: boolean;
}

export const CreateNovelModal: React.FC<CreateNovelModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  canClose = true 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">新建小说项目</h3>
          </div>
          {canClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">小说书名</label>
              <input 
                type="text" 
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入作品名称"
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">内容简介简述 (可选)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简短描述故事核心..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
              />
            </div>
            <p className="text-xs text-gray-500">新建小说将生成独立的隔离环境，不会与其他小说混淆。</p>
          </div>

          <div className="flex justify-end gap-2 text-sm">
            {canClose && (
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-md">
                取消
              </button>
            )}
            <button 
              type="submit" 
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
