import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Layers, Sparkles, Check, Link2, UploadCloud, RefreshCw, X, Edit, Eye } from 'lucide-react';
import { ConceptCategory, ConceptImage } from '../types';

interface ConceptArtViewProps {
  categories: ConceptCategory[];
  onAddCategory: (name: string, customId?: string) => void;
  onUpdateCategory: (id: string, updates: Partial<ConceptCategory>) => void;
  onDeleteCategory: (id: string) => void;
  onAddImage: (categoryId: string, image: ConceptImage) => void;
  onDeleteImage?: (categoryId: string, imageId: string) => void;
  onUpdateImage?: (categoryId: string, imageId: string, updates: Partial<ConceptImage>) => void;
  characters?: any[];
  onSyncToCharacter?: (characterId: string, imageUrl: string) => void;
  onRefreshDisk?: () => Promise<void> | void;
  style?: React.CSSProperties;
}

export const ConceptArtView: React.FC<ConceptArtViewProps> = ({ 
  categories = [], 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory, 
  onAddImage, 
  onDeleteImage,
  onUpdateImage,
  characters = [],
  onSyncToCharacter,
  onRefreshDisk,
  style 
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || '');
  const [newCatName, setNewCatName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Selection and editor states for images
  const [selectedImage, setSelectedImage] = useState<ConceptImage | null>(null);
  const [editingImage, setEditingImage] = useState<{ categoryId: string; image: ConceptImage } | null>(null);

  // States for manual image registration
  const [manualUrl, setManualUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep active category synced if list is updated/reloaded
  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];

  // Align activeCategoryId dynamically to avoid stale state causing broken inserts
  useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some(cat => cat.id === activeCategoryId);
      if (!exists) {
        setActiveCategoryId(categories[0].id);
      }
    } else {
      setActiveCategoryId('');
    }
  }, [categories, activeCategoryId]);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const customId = `cat-${Date.now()}`;
      onAddCategory(newCatName.trim(), customId);
      setActiveCategoryId(customId);
      setNewCatName('');
    }
  };

  const handleRegisterImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) {
      setErrorMsg('请选择一个录入分类');
      return;
    }
    if (!manualUrl.trim()) {
      setErrorMsg('请填写有效的图片URL或Base64地址');
      return;
    }

    const newImage: ConceptImage = {
      id: `img-${Date.now()}`,
      url: manualUrl.trim(),
      name: manualName.trim() || `插画_${Date.now().toString().slice(-4)}`,
      prompt: manualPrompt.trim() || '手动录入插画概念图',
      description: manualDescription.trim() || '',
      createdAt: new Date().toISOString()
    };

    onAddImage(activeCategory.id, newImage);
    setManualUrl('');
    setManualName('');
    setManualPrompt('');
    setManualDescription('');
    setErrorMsg('');
    setSuccessMsg('🎉 概念插画已成功录入当前分类！');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  return (
    <div className="flex-1 flex h-full bg-white/70 overflow-hidden" style={style}>
      {/* Sidebar for Categories */}
      <div className="w-64 border-r border-gray-200/50 bg-white/40 flex flex-col">
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">概念设计图</h2>
          {onRefreshDisk && (
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefreshDisk();
                  setSuccessMsg('🎉 已重新检索并同步本地库中改动！');
                  setTimeout(() => setSuccessMsg(''), 4000);
                } catch (e) {
                  setErrorMsg('同步本地库失败，请稍后刷新。');
                  setTimeout(() => setErrorMsg(''), 4000);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              className={`p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin text-blue-600' : ''
              }`}
              title="刷新/检索库文件中的改动"
              id="concept-art-refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-3">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="新增子项 (如: 特殊物品)" 
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleAddCategory}
              className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map(cat => (
            <div 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
                activeCategoryId === cat.id ? 'bg-blue-100/70 text-blue-700 font-medium' : 'text-gray-700 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 opacity-70" />
                <span className="text-sm truncate">{cat.name}</span>
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (window.confirm(`确定要永久删除分类【${cat.name}】及其下所有图片吗？`)) {
                    onDeleteCategory(cat.id); 
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white/30 overflow-hidden relative">
        {/* Toast notifications */}
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {activeCategory ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header section with Category details */}
            <div className="p-4 border-b border-gray-200/50 flex justify-between items-start gap-4 bg-white/50">
              <div className="flex-1">
                <h3 
                  className="text-xl font-bold text-gray-800 outline-none focus:bg-white/80 p-0.5 rounded cursor-text border border-dashed border-transparent hover:border-gray-200"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateCategory(activeCategory.id, { name: e.currentTarget.textContent || 'Unnamed' })}
                >
                  {activeCategory.name}
                </h3>
                <div 
                  className="text-xs text-gray-500 outline-none focus:bg-white/80 p-0.5 mt-1 rounded cursor-text border border-dashed border-transparent hover:border-gray-200 min-h-[18px]"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateCategory(activeCategory.id, { description: e.currentTarget.textContent || '' })}
                  placeholder="添加设定说明，例如生成该类图片的通用提示词背景..."
                >
                  {activeCategory.description || '添加设定说明，例如生成该类图片的通用提示词背景...'}
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Image Masonry Grid */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCategory.images && activeCategory.images.length > 0 ? (
                    activeCategory.images.map(img => (
                      <div key={img.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-150 flex flex-col group hover:shadow-md transition-shadow relative">
                        {/* Image canvas block */}
                        <div 
                          onClick={() => setSelectedImage(img)}
                          className="aspect-[16/9] relative bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
                          title="点击卡片主体放大观看并编辑完整背景信息与提示词"
                        >
                          {img.url ? (
                            <img src={img.url} alt={img.name || img.prompt} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}

                          {/* Hover Overlay info gradient */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <span className="text-[10px] text-gray-200 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> 点击查看精美无损大图与设定
                            </span>
                          </div>
                        </div>

                        {/* HOVER UTILITY PANEL: Top right of card containing Edit & Delete under it */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImage({ categoryId: activeCategory.id, image: img });
                            }}
                            className="bg-white/95 hover:bg-blue-600 hover:text-white text-gray-700 rounded-full p-2 shadow-md transition-all cursor-pointer hover:scale-110 flex items-center justify-center border border-gray-200/50"
                            title="编辑此图片属性 (如背景、描述、提示词)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button (exactly below edit) */}
                          {onDeleteImage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('您确定要将此幅概念插画卡片永久移除吗？')) {
                                  onDeleteImage(activeCategory.id, img.id);
                                }
                              }}
                              className="bg-white/95 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-2 shadow-md transition-all cursor-pointer hover:scale-110 flex items-center justify-center border border-gray-200/50"
                              title="删除此插图"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Card bottom details */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 border-t border-gray-100 bg-gray-50/40">
                          {/* 可编辑的名字栏 */}
                          <div>
                            <input 
                              type="text"
                              value={img.name || ''}
                              placeholder="点击为图片命名..."
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                if (onUpdateImage) {
                                  onUpdateImage(activeCategory.id, img.id, { name: e.target.value });
                                }
                              }}
                              className="w-full text-xs font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none"
                              title="图片名称栏 (可直接点击编辑)"
                            />
                          </div>

                          {/* Display core prompt clip */}
                          <p className="text-[10.5px] text-gray-500 line-clamp-1 italic px-1" title={img.prompt}>
                            Prompt: "{img.prompt || '暂无提示词'}"
                          </p>

                          {/* Avatar sync selector (RESTRICTION: ONLY SHOW IF CATEGORY NAME IS "人物设定图") */}
                          {activeCategory.name === "人物设定图" && characters && characters.length > 0 && onSyncToCharacter ? (
                            <div className="mt-1 border-t border-gray-200/50 pt-1.5">
                              <label className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">同步至人物设定</label>
                              <select 
                                onChange={(e) => {
                                  const charId = e.target.value;
                                  if (charId) {
                                    onSyncToCharacter(charId, img.url);
                                    const charName = characters.find(c => c.id === charId)?.name || '角色';
                                    setSuccessMsg(`🎉 已成功将该插画同步为角色【${charName}】的形象！`);
                                    setTimeout(() => setSuccessMsg(''), 4000);
                                    e.target.value = "";
                                  }
                                }}
                                className="w-full text-[10.5px] bg-white border border-gray-205 border-gray-200 rounded px-1.5 py-0.5 text-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-600"
                              >
                                <option value="">👤 关联角色形象头像...</option>
                                {characters.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.role || '无代号'})</option>
                                ))}
                              </select>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-16 h-16 mb-3 opacity-20" />
                      <p className="text-sm font-medium">暂无插图或概念草图</p>
                      <p className="text-xs mt-1 text-gray-550">您可在右侧 AI 助手对话中生成，或在右侧面板手动录入灵感图片</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: classification/manual registration form */}
              <div className="w-80 border-l border-gray-200/50 bg-white/20 p-4 shrink-0 flex flex-col gap-4 overflow-y-auto">
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200/40 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>分类录入设计图</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3 ml-0.5">
                    在此拖入、粘贴生成的 AI 图像或选择设备磁盘中的手画草稿进行分类备份。
                  </p>

                  <form onSubmit={handleRegisterImage} className="space-y-3">
                    {/* Picture title/name */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">插画名称</label>
                      <input 
                        type="text"
                        placeholder="如: 林源红雾巡逻、赤月内墙"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">图片来源 (支持点击/拖曳/粘贴图片)</label>
                      
                      {/* Drag & Drop Upload Zone */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setManualUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        onPaste={(e) => {
                          const items = e.clipboardData?.items;
                          if (items) {
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf('image') !== -1) {
                                const file = items[i].getAsFile();
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setManualUrl(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }
                          }
                        }}
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[110px] outline-none ${
                          manualUrl 
                            ? 'border-green-300 bg-green-50/10' 
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/10 focus:border-blue-400'
                        }`}
                        onClick={() => {
                          const fileInput = document.getElementById('concept-image-file-input');
                          fileInput?.click();
                        }}
                        tabIndex={0}
                        title="点击上传、拖拽放入图片或在此直接按 Ctrl+V 粘贴图片"
                      >
                        <input 
                          id="concept-image-file-input"
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const file = files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setManualUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        {manualUrl ? (
                          <div className="relative group w-full flex flex-col items-center">
                            <img 
                              src={manualUrl} 
                              alt="Upload preview" 
                              className="max-h-24 object-contain rounded border border-gray-200" 
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setManualUrl('');
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition-colors cursor-pointer"
                              title="移除图片"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[9px] text-green-600 mt-1 font-bold">✓ 图片就绪</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-gray-400 animate-pulse" />
                            <span className="text-[11px] text-gray-600 font-bold">点击上传 或 拖入概念图片</span>
                            <span className="text-[9px] text-gray-400 shrink-0">支持在框内 Ctrl+V 粘贴</span>
                          </>
                        )}
                      </div>

                      {/* URL Text input fallback */}
                      <div className="mt-2 text-left">
                        <span className="text-[9px] text-gray-400 block mb-0.5 font-bold">或在此输入外部图片网络直链:</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="https://example.com/art.jpg"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            className="w-full text-[10.5px] pl-6 pr-3 py-1 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                          />
                          <Link2 className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">图片设计背景描述</label>
                      <textarea
                        rows={2}
                        placeholder="在此补充画面代表的宏大世界观故事背景、场景说明或者物理质感等..."
                        value={manualDescription}
                        onChange={e => setManualDescription(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">画面提示词(AI Prompts)</label>
                      <textarea
                        rows={2}
                        placeholder="AI 绘图所使用的英文或中文 Prompt 标签组..."
                        value={manualPrompt}
                        onChange={e => setManualPrompt(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      确认登记并分类保存
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Layers className="w-12 h-12 mb-2 opacity-20 animate-pulse" />
            <span className="text-sm border-b border-transparent">请在左侧侧边栏选择或创建新设计项</span>
          </div>
        )}
      </div>

      {/* POPUP 1: IMAGE DETAILED VIEWER MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row relative">
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-15 transition-colors cursor-pointer"
              title="关闭详情视图"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Left side: large image display */}
            <div className="flex-1 bg-neutral-900 flex items-center justify-center p-4 relative group overflow-hidden">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name || selectedImage.prompt} 
                className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-300" 
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Right side: custom description/meta fields */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 p-6 flex flex-col justify-between overflow-y-auto bg-white">
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 block mb-1">概念设计名称</span>
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">
                    {selectedImage.name || "未登命名气概念卡"}
                  </h4>
                  <span className="text-[9px] text-gray-450 block mt-1">录入于: {new Date(selectedImage.createdAt).toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">图片设计背景描述 (设定背景)</span>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
                    {selectedImage.description || "暂无对此幅概念画面的专属背景设定说明。您可点击下方“修改”进行补充描述。"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">画图提示词标签 (Generation Prompts)</span>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono text-gray-600 max-h-44 overflow-y-auto whitespace-pre-wrap">
                    {selectedImage.prompt}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button 
                  onClick={() => {
                    setEditingImage({ categoryId: activeCategory.id, image: selectedImage });
                    setSelectedImage(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>编辑背景/提示词</span>
                </button>
                {onDeleteImage && (
                  <button 
                    onClick={() => {
                      if (window.confirm('您确定要将此幅概念插画卡片永久销毁吗？此操作不可恢复。')) {
                        onDeleteImage(activeCategory.id, selectedImage.id);
                        setSelectedImage(null);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 cursor-pointer font-medium"
                    title="彻底销毁插画"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: DESIGN CARD ATTRIBUTES AND CONFIGURATION EDITOR MODAL */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-blue-500" />
                <span>编辑概念插画信息 - {editingImage.image.name || "未命名"}</span>
              </h3>
              <button onClick={() => setEditingImage(null)} className="p-1 text-gray-450 hover:text-gray-750 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 text-left">
              {/* Thumbnail header */}
              <div className="flex gap-3 items-center bg-gray-50/50 p-2.5 rounded-lg border border-gray-150">
                <img src={editingImage.image.url} className="w-16 h-12 object-cover rounded shadow-sm border border-gray-200" referrerPolicy="no-referrer" />
                <div>
                  <div className="text-xs font-bold text-gray-700">{editingImage.image.name || "未登命名概念卡"}</div>
                  <div className="text-[10px] text-gray-400">ID: {editingImage.image.id}</div>
                </div>
              </div>

              {/* Name field */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">概念图卡片名称</label>
                <input 
                  type="text"
                  value={editingImage.image.name || ''}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    image: { ...editingImage.image, name: e.target.value }
                  })}
                  placeholder="如: 林源废墟巡查官"
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              {/* Background Description editing */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">图片设计背景及世界观说明</label>
                <textarea 
                  rows={3}
                  value={editingImage.image.description || ''}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    image: { ...editingImage.image, description: e.target.value }
                  })}
                  placeholder="输入此插画相匹配的故事线背景、角色出场环境描述或是物理色彩设定..."
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-gray-800"
                />
              </div>

              {/* Prompt editing */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">图片的生成提示词内容 (AI prompts)</label>
                <textarea 
                  rows={3}
                  value={editingImage.image.prompt || ''}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    image: { ...editingImage.image, prompt: e.target.value }
                  })}
                  placeholder="AI 绘图所采用的 Prompt 标签细节..."
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-700"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-150 flex justify-end gap-2">
              <button onClick={() => setEditingImage(null)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer">
                取消
              </button>
              <button 
                onClick={() => {
                  if (onUpdateImage) {
                    onUpdateImage(editingImage.categoryId, editingImage.image.id, {
                      name: editingImage.image.name,
                      description: editingImage.image.description,
                      prompt: editingImage.image.prompt
                    });
                  }
                  setEditingImage(null);
                  setSuccessMsg('🎉 插图设定与描述已成功更新！');
                  setTimeout(() => setSuccessMsg(''), 3500);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
