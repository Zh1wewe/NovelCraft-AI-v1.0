import React from 'react';
import { AppTheme } from '../types';
import { X } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose, theme, setTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">个性化外观</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">背景类型</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme({ ...theme, backgroundType: 'color', backgroundValue: '#f3f4f6' })}
                className={`flex-1 py-2 text-sm rounded-md border ${theme.backgroundType === 'color' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                纯色底色
              </button>
              <button 
                onClick={() => setTheme({ ...theme, backgroundType: 'image', backgroundValue: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2940' })}
                className={`flex-1 py-2 text-sm rounded-md border ${theme.backgroundType === 'image' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                自定义图片
              </button>
            </div>
            {theme.backgroundType === 'color' ? (
              <input 
                type="color" 
                value={theme.backgroundValue}
                onChange={(e) => setTheme({ ...theme, backgroundValue: e.target.value })}
                className="w-full h-10 p-1 rounded border border-gray-200 cursor-pointer"
              />
            ) : (
              <input 
                type="text" 
                placeholder="输入图片URL地址"
                value={theme.backgroundValue}
                onChange={(e) => setTheme({ ...theme, backgroundValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="flex justify-between text-sm font-medium text-gray-700">
              <span>毛玻璃透明度</span>
              <span className="text-gray-400">{Math.round(theme.panelOpacity * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={theme.panelOpacity}
              onChange={(e) => setTheme({ ...theme, panelOpacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <label className="flex justify-between text-sm font-medium text-gray-700">
              <span>毛玻璃模糊度</span>
              <span className="text-gray-400">{theme.blurAmount}px</span>
            </label>
            <input 
              type="range" 
              min="0" max="40" step="1"
              value={theme.blurAmount}
              onChange={(e) => setTheme({ ...theme, blurAmount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
