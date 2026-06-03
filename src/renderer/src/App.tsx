import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar, HeadingItem } from './components/Sidebar';
import { Reader, slugify } from './components/Reader';
import { Search } from './components/Search';
import { StatusBar } from './components/StatusBar';
import { FileText, ArrowRight, FolderOpen, Search as SearchIcon, ZoomIn, Sun, Moon, X } from 'lucide-react';
import logoDark from './assets/view.md.png';
import logoLight from './assets/view.md-light.png';

export default function App() {
  // Global States
  const [filePath, setFilePath] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isDarkActive, setIsDarkActive] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Sync with OS Theme
  useEffect(() => {
    const initTheme = async () => {
      if (theme === 'system') {
        const isDark = await window.electronAPI.getSystemTheme();
        setIsDarkActive(isDark);
      }
    };
    initTheme();

    // Hook listeners
    const unsubscribeTheme = window.electronAPI.onThemeChanged((isDark) => {
      if (theme === 'system') {
        setIsDarkActive(isDark);
      }
    });

    return () => {
      unsubscribeTheme();
    };
  }, [theme]);

  // Apply theme class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkActive) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkActive]);

  // Document Heading Outline Parser
  const parseHeadings = useCallback((md: string): HeadingItem[] => {
    const lines = md.split('\n');
    const items: HeadingItem[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // Extract h1, h2, and h3 tags
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2]
          .trim()
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // strip links formatting
          .replace(/[\*_`]/g, ''); // strip formats
        
        items.push({
          text,
          level,
          slug: slugify(text),
        });
      }
    }
    return items;
  }, []);

  // Safe file reader loader helper
  const loadFile = useCallback(async (path: string) => {
    try {
      const result = await window.electronAPI.readFile(path);
      if (result.success && result.content !== undefined) {
        setFilePath(path);
        setMarkdown(result.content);
        setHeadings(parseHeadings(result.content));
        setActiveSlug('');
        setSearchOpen(false);
      } else {
        alert(`Error opening file:\n${result.error}`);
      }
    } catch (e) {
      console.error('Error in loadFile:', e);
    }
  }, [parseHeadings]);

  // Listen to file-opened triggers from main process (Windows File Association / double click)
  useEffect(() => {
    const unsubscribeFile = window.electronAPI.onFileOpened((path) => {
      loadFile(path);
      setIsEditing(true); // Always open in split view for editing
    });
    return () => {
      unsubscribeFile();
    };
  }, [loadFile]);

  // Handle New File creation
  const handleNewFile = () => {
    setFilePath(null);
    setMarkdown('');
    setHeadings([]);
    setActiveSlug('');
    setSearchOpen(false);
    setIsEditing(true);
  };

  // Handle Save File
  const handleSaveFile = async () => {
    if (!isEditing && !filePath && !markdown) return;
    
    try {
      const result = await (window as any).electronAPI.saveFile(filePath, markdown);
      if (result && result.success && result.filePath) {
        setFilePath(result.filePath);
      } else if (result && result.error) {
        alert(`Error saving file:\n${result.error}`);
      }
    } catch (e) {
      console.error('Error in handleSaveFile:', e);
    }
  };

  // Dynamic Scroll Spy Section Highlighter
  const isAutoScrolling = React.useRef(false);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!markdown) return;
    
    const readerCanvas = document.querySelector('.markdown-prose')?.parentElement;
    if (!readerCanvas) return;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;

      const elHeadings = document.querySelectorAll('[data-outline-heading]');
      if (elHeadings.length === 0) return;

      let active = '';
      const triggerTopOffset = 120; // threshold index in pixels

      for (let i = 0; i < elHeadings.length; i++) {
        const el = elHeadings[i] as HTMLElement;
        const bounds = el.getBoundingClientRect();

        if (bounds.top <= triggerTopOffset) {
          active = el.getAttribute('data-heading-slug') || '';
        } else {
          break; // subsequent headers are below trigger threshold
        }
      }

      if (!active && elHeadings.length > 0) {
        active = elHeadings[0].getAttribute('data-heading-slug') || '';
      }

      if (active) {
        setActiveSlug(active);
      }
    };

    readerCanvas.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Trigger initial outline highlight check

    return () => readerCanvas.removeEventListener('scroll', handleScroll);
  }, [markdown]);

  // Click handler to scroll canvas to TOC headers
  const handleTocItemClick = (slug: string) => {
    const targetEl = document.getElementById(slug);
    if (targetEl) {
      isAutoScrolling.current = true;
      setActiveSlug(slug);
      targetEl.scrollIntoView({ behavior: 'smooth' });
      
      // Clear auto-scrolling flag after smooth scroll finishes (~800ms)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isAutoScrolling.current = false;
      }, 800);
    }
  };

  // OS Native Dialog opener
  const handleOpenFile = async () => {
    const path = await window.electronAPI.openFile();
    if (path) {
      loadFile(path);
      setIsEditing(true); // Automatically show editor for opened files
    }
  };

  // Zoom Operations
  const zoomIn = () => setZoom(z => Math.min(200, z + 10));
  const zoomOut = () => setZoom(z => Math.max(50, z - 10));
  const resetZoom = () => setZoom(100);

  // Cycle Theme selection
  const toggleTheme = () => {
    const nextIsDark = !isDarkActive;
    setTheme(nextIsDark ? 'dark' : 'light');
    setIsDarkActive(nextIsDark);
  };

  // Keyboard Hotkeys listener hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Open: Ctrl+O (or Cmd+O)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // New: Ctrl+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewFile();
      }
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      // 2. Zoom In: Ctrl+Plus / Ctrl+=
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      // 3. Zoom Out: Ctrl+Minus
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      // 4. Reset Zoom: Ctrl+0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
      // 5. Search Toggle: Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (ext === '.md' || ext === '.markdown' || ext === '.txt') {
        loadFile(file.path);
      } else {
        alert('Unsupported file format! Please drop an .md or .markdown file.');
      }
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-full flex flex-col overflow-hidden bg-[var(--rig-bg-paper)] text-[var(--rig-text-ink)] transition-colors duration-300 relative"
    >
      {/* Visual glowing border drop indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-zk-neon/10 dark:bg-[var(--rig-bg-dark)]/80 border-[4px] border-dashed border-[var(--rig-accent-primary)] z-50 flex items-center justify-center pointer-events-none backdrop-blur-[2px] animate-fade-in">
          <div className="bg-[var(--rig-bg-paper)] px-8 py-6 rounded-lg shadow-rig-card flex flex-col items-center gap-3 border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)]">
            <FileText className="text-[var(--rig-accent-primary)] animate-bounce" size={40} />
            <span className="text-base font-bold font-sans">Drop your Markdown file here</span>
            <span className="text-xs opacity-75 font-sans">Supports .md & .markdown extensions</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        filePath={filePath}
        theme={theme}
        isDarkActive={isDarkActive}
        zoom={zoom}
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        searchOpen={searchOpen}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onToggleTheme={toggleTheme}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        onToggleSearch={() => setSearchOpen(s => !s)}
      />

      {/* Search overlay panel */}
      <Search isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Primary Workspace Splitter Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {filePath || isEditing ? (
          <>
            {/* Reading outline sidebar */}
            {sidebarOpen && (
              <Sidebar
                headings={headings}
                activeSlug={activeSlug}
                onItemClick={handleTocItemClick}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
              />
            )}
            
            {/* Editor Pane (Left Split) */}
            {isEditing && (
              <div className="flex-1 border-r border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] bg-[var(--rig-bg-paper)] flex flex-col shrink-0 min-w-0">
                <div className="h-8 border-b border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] bg-zk-graylight dark:bg-zk-charcoal flex items-center justify-between px-4 shrink-0">
                  <span className="text-[10px] font-bold tracking-widest text-zk-charcoal dark:text-zk-graylight uppercase">Editor</span>
                  <button onClick={() => setIsEditing(false)} className="text-zk-charcoal dark:text-zk-graylight opacity-50 hover:opacity-100 transition-opacity" title="Close Editor">
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  className="flex-1 p-6 md:p-8 font-mono text-sm leading-relaxed resize-none outline-none bg-transparent text-zk-charcoal dark:text-zk-graylight focus:ring-0"
                  value={markdown}
                  onChange={(e) => {
                    setMarkdown(e.target.value);
                    setHeadings(parseHeadings(e.target.value));
                  }}
                  placeholder="Enter Markdown code here..."
                  spellCheck={false}
                />
              </div>
            )}
            
            <Reader
              markdown={markdown}
              filePath={filePath}
              zoom={zoom}
              isDark={isDarkActive}
            />
          </>
        ) : (
          
          /* Rig Styled Welcome Interface */
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--rig-bg-paper)] select-none animate-fade-in overflow-y-auto">
            <div className="max-w-md w-full flex flex-col items-stretch text-center gap-4">
              
              {/* App Emblem logo */}
              <img 
                src={isDarkActive ? logoLight : logoDark} 
                alt="view.md logo" 
                className="w-56 h-56 self-center object-contain transition-transform hover:scale-105 shrink-0" 
              />
              
              <div className="space-y-1 -mt-8 relative z-10">
                <h1 className="text-3xl font-bold font-mono tracking-tight text-[var(--rig-text-ink)]">view.md</h1>
                <p className="text-sm font-bold text-zk-charcoal dark:text-zk-graylight opacity-70">Open. Read. Done.</p>
              </div>

              {/* Interactive File Load box */}
              <button 
                onClick={handleOpenFile}
                className="w-full flex items-center justify-between p-4 rounded-md border-[2px] border-[var(--rig-text-ink)] bg-white dark:bg-black shadow-offset-dark dark:shadow-offset-neon hover:translate-y-[2px] hover:shadow-offset-dark-active dark:hover:shadow-offset-neon-active transition-all group shrink-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-sm bg-zk-graylight dark:bg-zk-charcoal text-[var(--rig-text-ink)]">
                    <FolderOpen size={20} />
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="text-sm font-bold text-[var(--rig-text-ink)] uppercase tracking-wide">Select Document</span>
                    <span className="text-xs text-[var(--rig-text-ink)] opacity-70">Browse your folders...</span>
                  </div>
                </div>
                <ArrowRight size={20} className="text-[var(--rig-text-ink)] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Drag zone marker */}
              <div className="w-full border-2 border-dashed border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] p-4 rounded-md flex flex-col items-center gap-2 bg-transparent text-[var(--rig-text-ink)] opacity-60 shrink-0">
                <span className="text-xs font-bold uppercase tracking-widest">Or drag and drop here</span>
              </div>

              {/* Keyboard Shortcuts cheat card */}
              <div className="w-full bg-[var(--rig-bg-dark)] text-[var(--rig-text-light)] rounded-md p-4 flex flex-col text-left gap-3 text-xs shadow-rig-card-light shrink-0 mt-2">
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-70">Shortcut Actions</span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono">
                  <div className="flex justify-between items-center"><span className="opacity-80">Open file</span> <kbd className="bg-white/10 px-2 py-1 rounded-sm">Ctrl + O</kbd></div>
                  <div className="flex justify-between items-center"><span className="opacity-80">Search</span> <kbd className="bg-white/10 px-2 py-1 rounded-sm">Ctrl + F</kbd></div>
                  <div className="flex justify-between items-center"><span className="opacity-80">Zoom In</span> <kbd className="bg-white/10 px-2 py-1 rounded-sm">Ctrl + =</kbd></div>
                  <div className="flex justify-between items-center"><span className="opacity-80">Zoom Out</span> <kbd className="bg-white/10 px-2 py-1 rounded-sm">Ctrl + -</kbd></div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Bottom Status bar */}
      <StatusBar 
        filePath={filePath} 
        markdown={markdown} 
        zoom={zoom} 
      />
    </div>
  );
}
