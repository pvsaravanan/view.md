import React from 'react';
import { FolderOpen, ZoomIn, ZoomOut, RotateCcw, Sun, Moon, Search, Minus, Square, X, PanelLeft, Download, FileCode2, FilePlus, Save } from 'lucide-react';

interface ToolbarProps {
  filePath: string | null;
  theme: 'light' | 'dark' | 'system';
  isDarkActive: boolean;
  zoom: number;
  sidebarOpen: boolean;
  sidebarWidth?: number;
  searchOpen: boolean;
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onToggleTheme: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleSidebar: () => void;
  onToggleSearch: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filePath,
  isDarkActive,
  zoom,
  sidebarOpen,
  sidebarWidth,
  searchOpen,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onToggleTheme,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleSidebar,
  onToggleSearch,
}) => {
  // Extract just the filename for display
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'No File Open';

  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  const handleExportPdf = async () => {
    try {
      await (window as any).electronAPI.exportPdf();
    } catch (e) {
      console.error('Failed to export PDF', e);
    }
  };

  const handleExportHtml = async () => {
    const readerHtml = document.querySelector('.markdown-prose')?.outerHTML || '';
    if (!readerHtml) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const htmlClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    const fullHtml = `<!DOCTYPE html>
<html class="${htmlClass}">
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  ${styles}
  <style>
    body { padding: 4rem; max-width: 1000px; margin: 0 auto; background-color: var(--rig-bg-paper); min-height: 100vh; height: auto !important; overflow: auto !important; }
    .markdown-prose { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
  </style>
</head>
<body class="${htmlClass}">
  ${readerHtml}
</body>
</html>`;

    try {
      await (window as any).electronAPI.exportHtml(fullHtml);
    } catch (e) {
      console.error('Failed to export HTML', e);
    }
  };

  return (
    <header className="print:hidden titlebar-drag h-16 w-full flex items-center justify-between border-b border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] bg-[var(--rig-bg-paper)] px-4 select-none z-30 shrink-0">
      
      {/* Left side: App Logo and Toggle Sidebar */}
      <div 
        className="titlebar-nodrag flex items-center shrink-0 transition-all"
        style={{ width: sidebarOpen && sidebarWidth ? `${sidebarWidth - 16}px` : 'auto' }}
      >
        <button
          onClick={onToggleSidebar}
          title="Toggle Outline"
          className={`p-2 rounded-sm border border-transparent transition-all flex items-center ${
            sidebarOpen ? 'text-[var(--rig-text-ink)] opacity-100 w-full justify-start' : 'text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-white dark:hover:bg-zk-black justify-center'
          }`}
        >
          <PanelLeft size={18} />
        </button>
      </div>
      
      <div className="titlebar-nodrag flex items-center gap-2 ml-2">
        
        <button
          onClick={onNewFile}
          title="New File (Ctrl+N)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-transparent text-xs font-semibold text-[var(--rig-text-ink)] hover:bg-white dark:hover:bg-zk-black transition-all active:scale-[0.97]"
        >
          <FilePlus size={16} />
          <span>New</span>
        </button>

        <button
          onClick={onOpenFile}
          title="Open File (Ctrl+O)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-transparent text-xs font-semibold text-[var(--rig-text-ink)] hover:bg-white dark:hover:bg-zk-black transition-all active:scale-[0.97]"
        >
          <FolderOpen size={16} />
          <span>Open</span>
        </button>

        <button
          onClick={onSaveFile}
          title="Save File (Ctrl+S)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-transparent text-xs font-semibold text-[var(--rig-text-ink)] hover:bg-white dark:hover:bg-zk-black transition-all active:scale-[0.97]"
        >
          <Save size={16} />
          <span>Save</span>
        </button>

        {/* Vertical Divider */}
        <div className="w-[1px] h-4 bg-zk-graymed dark:bg-zk-charcoal mx-1" />

        <button
          onClick={handleExportPdf}
          title="Export as PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-transparent text-xs font-medium text-[var(--rig-text-ink)] opacity-80 hover:opacity-100 hover:bg-white dark:hover:bg-zk-black transition-all active:scale-[0.97]"
        >
          <Download size={15} />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={handleExportHtml}
          title="Export as HTML"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-transparent text-xs font-medium text-[var(--rig-text-ink)] opacity-80 hover:opacity-100 hover:bg-white dark:hover:bg-zk-black transition-all active:scale-[0.97]"
        >
          <FileCode2 size={15} />
          <span className="hidden sm:inline">HTML</span>
        </button>
      </div>

      {/* Center: File Name (Trunked path if long) */}
      <div className="flex-1 flex justify-center px-4 overflow-hidden">
        <span 
          title={filePath || ''} 
          className="text-xs font-mono font-bold truncate max-w-[280px] sm:max-w-[420px] text-[var(--rig-text-ink)]"
        >
          {fileName}
        </span>
      </div>

      {/* Right side: Tools, Theme, Search, and Window Controls */}
      <div className="titlebar-nodrag flex items-center gap-2">
        
        {/* Zoom Operations */}
        <div className="flex items-center bg-transparent border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] rounded-md shadow-sm mr-2">
          <button
            onClick={onZoomOut}
            title="Zoom Out (Ctrl+-)"
            className="p-1.5 rounded-l-md hover:bg-white dark:hover:bg-zk-black text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11px] font-mono font-bold px-2 min-w-[42px] text-center text-[var(--rig-text-ink)] border-x border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] py-1 bg-white dark:bg-zk-black shadow-inner">
            {zoom}%
          </span>
          <button
            onClick={onZoomIn}
            title="Zoom In (Ctrl+=)"
            className="p-1.5 rounded-r-md hover:bg-white dark:hover:bg-zk-black text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          {zoom !== 100 && (
            <button
              onClick={onResetZoom}
              title="Reset Zoom (Ctrl+0)"
              className="p-1.5 rounded-r-md border-l border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] hover:bg-white dark:hover:bg-zk-black text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Search Toggle */}
        <button
          onClick={onToggleSearch}
          title="Search Document (Ctrl+F)"
          className={`p-2 rounded-sm border border-transparent transition-all ${
            searchOpen ? 'text-zk-black bg-[var(--rig-accent-primary)] border-[var(--rig-border)]' : 'text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-white dark:hover:bg-zk-black'
          }`}
        >
          <Search size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDarkActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-sm border border-transparent text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-white dark:hover:bg-zk-black transition-all"
        >
          {isDarkActive ? (
            <Sun size={18} className="rotate-0 scale-100 transition-transform duration-300" />
          ) : (
            <Moon size={18} className="rotate-0 scale-100 transition-transform duration-300" />
          )}
        </button>

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-zk-graymed dark:bg-zk-charcoal mx-3" />

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            title="Minimize"
            className="p-2 rounded-none text-zk-graydark hover:text-zk-charcoal dark:hover:text-zk-white hover:bg-zk-offwhite dark:hover:bg-zk-charcoal transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximize}
            title="Maximize"
            className="p-2 rounded-none text-zk-graydark hover:text-zk-charcoal dark:hover:text-zk-white hover:bg-zk-offwhite dark:hover:bg-zk-charcoal transition-colors"
          >
            <Square size={14} />
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="p-2 rounded-none text-zk-graydark hover:text-zk-white hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
