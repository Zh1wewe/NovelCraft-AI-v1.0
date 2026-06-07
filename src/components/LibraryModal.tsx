import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, FileText, FolderOpen, ChevronRight, Upload, Download, Settings, Plus, Trash2, Save, File, Edit, ArrowLeft, HardDrive, HelpCircle } from 'lucide-react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelName: string;
  onNavigate?: (tabId: string) => void;
  onExport?: (assetId: string) => void;
  onOpenSettings?: () => void;
}

interface FileNode {
  name: string;
  relativePath: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ 
  isOpen, 
  onClose, 
  novelName, 
  onNavigate, 
  onExport, 
  onOpenSettings 
}) => {
  const [currentPath, setCurrentPath] = useState<string>(''); // Active browsed folder path (e.g. '', '参考资料库', or '参考资料库/自定义内嵌')
  const [localStoreTree, setLocalStoreTree] = useState<FileNode[]>([]);
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [baseDir, setBaseDir] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'workspace' | 'item';
    itemType?: 'file' | 'directory';
    targetPath?: string;
    targetName?: string;
  } | null>(null);

  // Non-blocking UI replacement states for alerts, confirms, prompts
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    type: 'createFile' | 'createFolder' | 'rename';
    title: string;
    label: string;
    defaultValue: string;
    targetPath?: string;
    placeholder?: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 3500);
  };

  // Close context menu on click anywhere
  useEffect(() => {
    const dismissMenu = () => setContextMenu(null);
    window.addEventListener('click', dismissMenu);
    return () => window.removeEventListener('click', dismissMenu);
  }, []);

  // Fetch directory tree from backend
  const loadLocalDirectoryTree = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success && data.tree) {
        setLocalStoreTree(data.tree);
      }
    } catch (e) {
      console.error("loadLocalDirectoryTree failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        setBaseDir(data.baseDir || '作品物理根目录');
      }
    } catch (e) {
      console.error("fetch /api/config failed:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLocalDirectoryTree();
      loadConfig();
      setEditingFile(null);
      setCurrentPath(''); // Default to root
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles double click or click on folder to enter it
  const handleEnterFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    setEditingFile(null);
  };

  // Handles opening custom file editor
  const handleOpenFile = async (relPath: string, fileName: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/read?path=${encodeURIComponent(relPath)}`);
      const data = await res.json();
      if (data.success) {
        setEditingFile({
          path: relPath,
          name: fileName,
          content: data.content
        });
      } else {
        showToast("读取文件内容失败: " + data.error, "error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Save modified file content physically
  const handleSaveFileContent = async () => {
    if (!editingFile) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/documents/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          relativePath: editingFile.path,
          content: editingFile.content
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🎉 文件已成功保存至本地物理介质", "success");
      } else {
        showToast("保存失败: " + data.error, "error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // State driven Prompt Dialog submission handler
  const handlePromptSubmit = async (inputValue: string) => {
    if (!promptDialog) return;
    const { type, targetPath } = promptDialog;
    const cleanValue = inputValue.trim();
    if (!cleanValue) {
      showToast("输入不能为空！", "error");
      return;
    }

    if (type === 'createFile') {
      let finalName = cleanValue;
      if (!finalName.endsWith('.txt') && !finalName.endsWith('.md')) {
        finalName = `${finalName}.txt`;
      }
      try {
        setLoading(true);
        const res = await fetch('/api/documents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: currentPath,
            fileName: finalName
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast("🎉 物理草稿空白文档创建成功！", "success");
          await loadLocalDirectoryTree();
          const createdRelPath = currentPath ? `${currentPath}/${finalName}` : finalName;
          await handleOpenFile(createdRelPath, finalName);
        } else {
          showToast("创建文件失败: " + data.error, "error");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setPromptDialog(null);
      }
    } else if (type === 'createFolder') {
      const targetFolderPath = currentPath ? `${currentPath}/${cleanValue}` : cleanValue;
      try {
        setLoading(true);
        const res = await fetch('/api/documents/create-directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderPath: targetFolderPath })
        });
        const data = await res.json();
        if (data.success) {
          showToast("🎉 物理文件夹创建成功！", "success");
          await loadLocalDirectoryTree();
        } else {
          showToast("新建文件夹失败: " + data.error, "error");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setPromptDialog(null);
      }
    } else if (type === 'rename') {
      if (!targetPath) return;
      if (cleanValue === promptDialog.defaultValue) {
        setPromptDialog(null);
        return;
      }
      const pathParts = targetPath.split('/');
      pathParts[pathParts.length - 1] = cleanValue;
      const newPath = pathParts.join('/');

      try {
        setLoading(true);
        const res = await fetch('/api/documents/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath: targetPath, newPath: newPath })
        });
        const data = await res.json();
        if (data.success) {
          showToast("🎉 重命名物理节点成功！", "success");
          await loadLocalDirectoryTree();
          if (editingFile?.path === targetPath) {
            setEditingFile(prev => prev ? { ...prev, path: newPath, name: cleanValue } : null);
          }
        } else {
          showToast("重命名失败: " + data.error, "error");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setPromptDialog(null);
      }
    }
  };

  // Trigger creating a new blank document
  const handleCreateFileAction = () => {
    setPromptDialog({
      isOpen: true,
      type: 'createFile',
      title: '新建本地物理草稿卡片',
      label: '请输入物理草稿文件名称:',
      defaultValue: '新草稿.txt',
      placeholder: '例如：主线伏笔设计.md'
    });
  };

  // Trigger creating a folder
  const handleCreateDirectoryAction = () => {
    setPromptDialog({
      isOpen: true,
      type: 'createFolder',
      title: '新建本地分类文件夹',
      label: '请输入文件夹名称:',
      defaultValue: '新分卷分类',
      placeholder: '例如：第2分卷大纲与世界观'
    });
  };

  // Trigger Renaming
  const handleRenameAction = (targetPath: string, oldName: string) => {
    setPromptDialog({
      isOpen: true,
      type: 'rename',
      title: '物理节点重命名',
      label: `请为【${oldName}】设定新名字:`,
      defaultValue: oldName,
      targetPath,
      placeholder: '请输入不包含特殊字符的名称'
    });
  };

  // Trigger delete action with customized dialog verification
  const handleDeleteAction = (relPath: string, name: string, type: 'file' | 'directory') => {
    const warningText = type === 'directory' 
      ? `确认要彻底物理删除文件夹 【${name}】 及其内部的所有文件吗？此物理底层动作极其危险且不可逆！`
      : `确认要下架并彻底删除参考物理文献卡片 【${name}】 吗？此物理底层清除动作不可撤销！`;
    
    setConfirmDialog({
      isOpen: true,
      title: type === 'directory' ? "⚠️ 极其危险的物理文件夹删除" : "⚠️ 物理文献卡片下架删除",
      message: warningText,
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch('/api/documents/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relativePath: relPath })
          });
          const data = await res.json();
          if (data.success) {
            showToast("🎉 物理节点已完全销毁", "success");
            if (editingFile?.path === relPath) {
              setEditingFile(null);
            }
            await loadLocalDirectoryTree();
          } else {
            showToast("底层物理清除失败: " + data.error, "error");
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Action: Upload raw file
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const textVal = evt.target?.result as string;
      try {
        setLoading(true);
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            content: textVal || '',
            folder: currentPath
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🎉 参考文件 ${file.name} 已成功导入本地级目。`);
          await loadLocalDirectoryTree();
        } else {
          alert("上传失败: " + data.error);
        }
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Helper: Retrieve active parsed list corresponding to the current browsed path level
  const getActiveNodes = (): FileNode[] => {
    if (!currentPath) {
      return localStoreTree;
    }
    const parts = currentPath.split('/');
    let currentLevel = localStoreTree;
    
    for (const part of parts) {
      const match = currentLevel.find(n => n.name === part && n.type === 'directory');
      if (match && match.children) {
        currentLevel = match.children;
      } else {
        return [];
      }
    }
    return currentLevel;
  };

  const activeNodes = getActiveNodes();

  // Helper: Get list of top level folders for the sidebar shortcut tree
  const getTopLevelFolders = (): FileNode[] => {
    return localStoreTree.filter(n => n.type === 'directory');
  };

  // Helper: Get the FileNode of the active novel from the tree
  const getActiveNovelNode = (): FileNode | null => {
    if (!novelName) return null;
    return localStoreTree.find(n => n.name === novelName && n.type === 'directory') || null;
  };

  // Capture context menu coords
  const handleTriggerContextMenu = (e: React.MouseEvent, type: 'workspace' | 'item', node?: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContextMenu({
      x,
      y,
      type,
      itemType: node?.type,
      targetPath: node?.relativePath,
      targetName: node?.name
    });
  };

  // Back breadcrumb jump
  const handleJumpToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath('');
      setEditingFile(null);
      return;
    }
    const parts = currentPath.split('/');
    const targetParts = parts.slice(0, index + 1);
    setCurrentPath(targetParts.join('/'));
    setEditingFile(null);
  };

  const pathSegments = currentPath ? currentPath.split('/') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fcfdfe] rounded-2xl shadow-3xl w-[980px] h-[660px] overflow-hidden flex flex-col border border-gray-200/80">
        
        {/* Header Block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-yellow-50 rounded-lg border border-yellow-200/50">
              <FolderOpen className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                本地物理资源管理器 (Windows File Explorer)
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold select-none border border-blue-100">物理存储比对</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                直接操作本地文件系统。
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden relative" ref={containerRef}>
          
          {/* L. Sidebar Shortcut tree */}
          <div className="w-56 bg-gray-50/50 border-r border-gray-200/80 flex flex-col p-3.5 space-y-3 shrink-0">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-gray-405" />
              <span>智能云盘卷组目录</span>
            </div>

             <div className="space-y-1 overflow-y-auto flex-1 select-none pr-1 scrollbar-thin">
              {/* Root Link */}
              <button
                onClick={() => { setCurrentPath(''); setEditingFile(null); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                  currentPath === ''
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                    : 'text-gray-650 hover:bg-gray-100/80 text-gray-700'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{baseDir || '作品物理根目录'}</span>
              </button>

              {/* Recursive shortcut listing */}
              {getTopLevelFolders()
                .filter(folder => folder.name !== novelName) // Keep core folders here, group novel separately
                .map(folder => (
                  <button
                    key={folder.relativePath}
                    onClick={() => handleEnterFolder(folder.relativePath)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                      currentPath === folder.relativePath || currentPath.startsWith(folder.relativePath + '/')
                        ? 'bg-yellow-50/60 text-yellow-850 font-medium border border-yellow-105'
                        : 'text-gray-600 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                  </button>
                ))
              }

              {/* Active Novel-specific partitioned workspace navigation shortcut */}
              {novelName && (
                <div className="mt-4 pt-3 border-t border-gray-200/50 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1 mb-1 shadow-xxs">
                    <span>📚 当前小说物理分区</span>
                  </div>

                  <button
                    onClick={() => handleEnterFolder(novelName)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left font-semibold cursor-pointer ${
                      currentPath === novelName
                        ? 'bg-purple-50 text-purple-700 border border-purple-150'
                        : 'text-gray-600 hover:bg-gray-100/70'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
                    <span className="truncate">{novelName}</span>
                  </button>

                  {/* Child nodes subdirectories for active novel */}
                  {(() => {
                    const novelNode = getActiveNovelNode();
                    if (novelNode && novelNode.children) {
                      return novelNode.children
                        .filter(c => c.type === 'directory')
                        .map(sub => {
                          const isSubActive = currentPath === sub.relativePath || currentPath.startsWith(sub.relativePath + '/');
                          return (
                            <button
                              key={sub.relativePath}
                              onClick={() => handleEnterFolder(sub.relativePath)}
                              className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.2 rounded-md text-[11px] transition-all text-left cursor-pointer ${
                                isSubActive
                                  ? 'bg-purple-50/60 text-purple-750 font-bold border border-purple-100/40 border-l-2 border-l-purple-500'
                                  : 'text-gray-500 hover:bg-gray-100/40'
                              }`}
                            >
                              <Folder className={`w-3 h-3 ${isSubActive ? 'text-purple-500' : 'text-gray-400'}`} />
                              <span className="truncate">{sub.name}</span>
                            </button>
                          );
                        });
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Bottom Actions settings anchor */}
            <div className="pt-2 border-t border-gray-200/60">
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                <span>API 大模型连接配置入口</span>
              </button>
            </div>
          </div>

          {/* R. Workspace Panel */}
          <div 
            className="flex-1 bg-white flex flex-col overflow-hidden select-none"
            onContextMenu={(e) => handleTriggerContextMenu(e, 'workspace')}
          >
            {/* Address Bar */}
            <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between text-xs text-gray-400 bg-gray-50/50">
              <div className="flex items-center gap-1">
                <span 
                  className="text-gray-500 hover:text-blue-600 font-semibold cursor-pointer font-mono"
                  onClick={() => handleJumpToBreadcrumb(-1)}
                >
                  {baseDir || '作品物理根目录'}
                </span>
                {pathSegments.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <span 
                      className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer"
                      onClick={() => handleJumpToBreadcrumb(idx)}
                    >
                      {seg}
                    </span>
                  </React.Fragment>
                ))}

                {editingFile && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-gray-800 font-semibold bg-gray-200/60 py-0.5 px-2 rounded-md">
                      {editingFile.name}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-3 w-[1px] bg-gray-200" />
              </div>
            </div>

            {/* Area Actions Header Panel when not editing */}
            {!editingFile && (
              <div className="px-5 py-2 bg-white border-b border-gray-100 flex items-center justify-between shadow-xs z-10">
                <div className="flex gap-2">
                  <button 
                    onClick={handleCreateDirectoryAction}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-250 border-yellow-200 hover:bg-yellow-100/70 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建文件夹</span>
                  </button>
                  <button 
                    onClick={handleCreateFileAction}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-705 text-purple-700 border border-purple-200 hover:bg-purple-100/75 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建空白文档</span>
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/80 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>上传物理资料</span>
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLocalFileUpload}
                    className="hidden"
                    accept=".txt,.md"
                  />
                </div>
              </div>
            )}

            {/* Main Area Viewport */}
            <div className="flex-1 overflow-y-auto p-5 relative">
              
              {!editingFile ? (
                <>
                  {activeNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-150 rounded-2xl bg-gray-50/20">
                      <Folder className="w-12 h-12 text-gray-250 text-gray-300 mb-3" />
                      <span className="text-xs text-gray-400 font-bold">该目录视窗在此状态下为空</span>
                      <p className="text-[10px] text-gray-400 mt-1">可以通过上方快捷栏或右键单击新建文件夹和空白文档</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 select-none">
                      
                      {/* Navigate Up Item if nested */}
                      {currentPath && (
                        <div 
                          onClick={() => {
                            const parts = currentPath.split('/');
                            parts.pop();
                            setCurrentPath(parts.join('/'));
                          }}
                          className="flex flex-col items-center text-center p-3.5 border border-dashed border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all group"
                        >
                          <div className="p-2 mb-2 text-gray-400 group-hover:text-gray-600">
                            <ArrowLeft className="w-7 h-7" />
                          </div>
                          <span className="text-xs font-bold text-gray-500 tracking-tight font-sans">返回上一级</span>
                        </div>
                      )}

                      {/* Display directory/file cards */}
                      {activeNodes.map((node) => {
                        const isDir = node.type === 'directory';
                        return (
                          <div 
                            key={node.relativePath}
                            onClick={() => {
                              if (isDir) {
                                handleEnterFolder(node.relativePath);
                              } else {
                                handleOpenFile(node.relativePath, node.name);
                              }
                            }}
                            onContextMenu={(e) => handleTriggerContextMenu(e, 'item', node)}
                            className={`flex flex-col items-center text-center p-3.5 border rounded-xl cursor-pointer hover:shadow-sm transition-all group relative ${
                              isDir 
                                ? 'border-yellow-100 bg-yellow-50/10 hover:bg-yellow-50/25 hover:border-yellow-200' 
                                : 'border-gray-150 hover:bg-purple-50/5 hover:border-purple-200'
                            }`}
                          >
                            <div className="p-1 mb-2">
                              {isDir ? (
                                <Folder className="w-8 h-8 text-yellow-500 fill-yellow-200/40 group-hover:scale-105 transition-transform" />
                              ) : (
                                <FileText className="w-8 h-8 text-purple-500 group-hover:scale-105 transition-transform" />
                              )}
                            </div>
                            <span 
                              className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight font-sans break-all select-none px-0.5"
                              title={node.name}
                            >
                              {node.name}
                            </span>
                            
                            {/* Fast Inline Hover Deletion */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAction(node.relativePath, node.name, node.type);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-red-50 border border-gray-150 hover:border-red-200 text-gray-400 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="彻底物理删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Edit file content view */
                <div className="flex flex-col h-full space-y-3 animate-fade-in absolute inset-0 bg-white p-5">
                  <div className="flex items-center justify-between bg-purple-50/30 p-2.5 rounded-xl border border-purple-200/20">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
                      <span className="text-xs font-bold text-gray-700 font-sans">
                        正在交互式读写物理介质：{editingFile.name} (100% 物理层同步)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <button
                        onClick={handleSaveFileContent}
                        disabled={isSaving}
                        className="flex items-center gap-1 text-xs bg-purple-650 bg-purple-600 active:bg-purple-700 hover:bg-purple-750 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? '正在保存...' : '保存物理修改'}</span>
                      </button>
                      <button
                        onClick={() => setEditingFile(null)}
                        className="text-xs bg-gray-150 hover:bg-gray-250 hover:bg-gray-200 text-gray-650 text-gray-700 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        关闭并返回目录
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={editingFile.content}
                    onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                    placeholder="文档中当前没有任何文字信息。请在这里直接编辑、粘贴参考资料或草稿稿件，更改后点击右上角“保存物理修改”即可完美存盘..."
                    className="flex-1 w-full min-h-[310px] resize-none border border-gray-200 rounded-xl p-4 text-xs font-mono bg-amber-50/10 focus:outline-none focus:ring-1 focus:ring-purple-400 leading-relaxed tracking-wide shadow-inner"
                  />
                  
                  <div className="text-[10px] text-gray-400 select-none bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                    <span className="text-purple-600 font-bold select-none shrink-0">💡 AI 编写联动：</span>
                    <span className="leading-snug">
                      在此处创建并编辑物理文件后，在任意 AI 标签页或大纲写作中，可直接在文本中或指令里告诉助手：<b>“参考本地【{editingFile.name}】里面设想的伏笔来续章节”</b>，AI 程序会自动关联此真实地址，实现数据无缝对流。
                    </span>
                  </div>
                </div>
              )}

              {/* Float Absolute Windows Context Menu */}
              {contextMenu && (
                <div 
                  className="absolute bg-white border border-gray-200/80 rounded-xl shadow-xl py-1 px-1 z-50 min-w-[150px] text-xs font-semibold animate-fade-in text-gray-700 select-none"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contextMenu.type === 'workspace' ? (
                    <>
                      <button 
                        onClick={() => { setContextMenu(null); handleCreateDirectoryAction(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-yellow-50 hover:text-yellow-800 rounded-lg text-left cursor-pointer transition-colors"
                      >
                        <Folder className="w-3.5 h-3.5 text-yellow-500" />
                        <span>新建文件夹</span>
                      </button>
                      <button 
                        onClick={() => { setContextMenu(null); handleCreateFileAction(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-left cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                        <span>新建空白文档</span>
                      </button>
                      <div className="h-[1px] bg-gray-100 my-1" />
                      <button 
                        onClick={() => { setContextMenu(null); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>上传参考文件</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setContextMenu(null);
                          if (contextMenu.targetPath) {
                            handleRenameAction(contextMenu.targetPath, contextMenu.targetName || '');
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-750 text-indigo-700 rounded-lg text-left cursor-pointer transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-500" />
                        <span>重命名</span>
                      </button>
                      <button 
                        onClick={() => {
                          setContextMenu(null);
                          if (contextMenu.targetPath && contextMenu.targetName) {
                            handleDeleteAction(contextMenu.targetPath, contextMenu.targetName, contextMenu.itemType || 'file');
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 hover:text-red-700 text-red-600 rounded-lg text-left cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>彻底物理删除</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Custom Prompt Dialog replacement */}
              {promptDialog && (
                <div 
                  className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] animate-fade-in"
                  onClick={() => setPromptDialog(null)}
                >
                  <div 
                    className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-[420px] space-y-4 relative animate-scale-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                        <Edit className="w-4 h-4 text-blue-600 animate-pulse" />
                        {promptDialog.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">{promptDialog.label}</p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formVal = new FormData(e.currentTarget);
                        const value = formVal.get('promptInput')?.toString() || '';
                        handlePromptSubmit(value);
                      }}
                      className="space-y-4"
                    >
                      <input
                        type="text"
                        name="promptInput"
                        defaultValue={promptDialog.defaultValue}
                        placeholder={promptDialog.placeholder}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50/50 font-medium text-gray-800"
                      />

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                        <button
                          type="button"
                          onClick={() => setPromptDialog(null)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          取消及回退
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          确认建立 / 更改
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Custom Confirm Dialog replacement */}
              {confirmDialog && (
                <div 
                  className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1.5px] animate-fade-in"
                  onClick={() => setConfirmDialog(null)}
                >
                  <div 
                    className="bg-white rounded-2xl border border-red-150 shadow-2xl p-6 w-[440px] space-y-4 relative animate-scale-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-50 rounded-xl text-red-650 border border-red-100 shrink-0">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-800 text-sm">
                          {confirmDialog.title}
                        </h4>
                        <p className="text-xs text-gray-550 leading-relaxed font-semibold text-gray-505 text-gray-600">
                          {confirmDialog.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2.5 border-t border-gray-150">
                      <button
                        type="button"
                        onClick={() => setConfirmDialog(null)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        舍弃此操作
                      </button>
                      <button
                        type="button"
                        onClick={confirmDialog.onConfirm}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        确认执行彻底物理清除
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Elegant floating status micro-toast notification */}
              {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-bounce-short ${
                  toast.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-50/50' 
                    : toast.type === 'error'
                      ? 'bg-red-50 text-red-800 border-red-200 shadow-red-50/50'
                      : 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-50/50'
                }`}>
                  {toast.type === 'success' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                  {toast.type === 'error' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                  <span>{toast.message}</span>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
