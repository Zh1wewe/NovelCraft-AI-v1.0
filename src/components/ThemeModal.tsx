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
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { name: '羊皮纸', value: '#fdf6e3' },
                  { name: '淡青绿', value: '#e8f5e9' },
                  { name: '天蓝色', value: '#e0f2fe' },
                  { name: '樱花粉', value: '#fce7f3' },
                  { name: '星空灰', value: '#1e293b' },
                  { name: '极简白', value: '#ffffff' }
                ].map(c => (
                  <button
                    key={c.value}
                    onClick={() => setTheme({ ...theme, backgroundValue: c.value })}
                    className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${theme.backgroundValue === c.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
                <div className="relative w-8 h-8 rounded-full border shadow-sm border-gray-200 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                  <input 
                    type="color" 
                    value={theme.backgroundValue}
                    onChange={(e) => setTheme({ ...theme, backgroundValue: e.target.value })}
                    className="absolute -inset-4 w-16 h-16 cursor-pointer"
                    title="自定义调色盘"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setTheme({ ...theme, backgroundValue: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer outline-none"
                />
                {theme.backgroundValue && theme.backgroundValue.startsWith('data:image') && (
                  <div className="mt-3 w-full h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={theme.backgroundValue} alt="当前背景" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
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
