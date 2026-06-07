import React, { useState } from 'react';
import { Folder, Save, Sparkles, AlertCircle, Check } from 'lucide-react';

interface DirectoryInitModalProps {
  isOpen: boolean;
  onConfirm: (path: string) => Promise<void>;
}

export const DirectoryInitModal: React.FC<DirectoryInitModalProps> = ({ isOpen, onConfirm }) => {
  const [path, setPath] = useState('C:\\小说物理资料库');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) {
      setError('请输入或选择一个有效的文件保存目录物理路径');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(path.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || '设置保存路径时遇到物理错误，请检查权限。');
    } finally {
      setSubmitting(false);
    }
  };

  const usePresetPath = (preset: string) => {
    setPath(preset);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-3xl w-[520px] overflow-hidden border border-gray-250 p-6 flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-50 rounded-xl border border-yellow-250 text-yellow-600">
            <Folder className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-1.5 font-sans">
              首次运行：配置小说物理落盘目录
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              为了建立物理存储区（正文、层级大纲、思维脑图树等）
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
            程序将调用本地物理文件API，以您设定的目录作为作品终极存储仓库。设定后将一键自动伴随生成：<b>公共资料库</b>（包含<b>参考资料库</b>，用于让大模型自动学习并遵循您的文风习惯）。
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">物理保存根目录路径 (Absolute Filepath)</label>
            <div className="relative">
              <input
                type="text"
                disabled={success}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="例如 C:\小说物理工作空间 或 /Users/workspace/novels"
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono bg-white font-medium"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              * 所有新建小说都将以小说同名在上述根目录下作为新文件夹建立，并关联全部文档卡片。
            </p>
          </div>

          {/* Presets */}
          {!success && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">推荐常用物理路径预设</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => usePresetPath('C:\\小说物理资料库')}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200 transition-colors cursor-pointer"
                >
                  C:\小说物理资料库
                </button>
                <button
                  type="button"
                  onClick={() => usePresetPath('D:\\MyNovelSpace')}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200 transition-colors cursor-pointer"
                >
                  D:\MyNovelSpace
                </button>
                <button
                  type="button"
                  onClick={() => usePresetPath('/Users/novels/physics-space')}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200 transition-colors cursor-pointer"
                >
                  macOS/Linux 默认空间
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700/90 text-xs p-2.5 rounded-lg border border-red-150 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-850 text-xs p-2.5 rounded-lg border border-green-200 flex items-center gap-2 font-medium animate-fade-in">
              <Check className="w-4 h-4 text-green-500 shrink-0 animate-bounce" />
              <span>设置成功！公共资料库与文风库已成功初始化完毕。进入物理创作空间！</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            {success ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-md shadow-green-100/50 transition-all cursor-pointer"
              >
                <span>进入小说物理空间</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-105/50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? '正在物理初始化...' : '物理初始化设定'}</span>
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
