import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft } from 'lucide-react';

export interface HeadingItem {
  text: string;
  level: number;
  slug: string;
}

interface SidebarProps {
  headings: HeadingItem[];
  activeSlug: string;
  onItemClick: (slug: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  headings,
  activeSlug,
  onItemClick,
  width,
  onWidthChange,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Resize handler using mouse drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width relative to window
      const newWidth = Math.max(160, Math.min(380, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div className="print:hidden flex shrink-0 h-full relative" style={{ width: `${width}px` }}>
      
      {/* Sidebar Content */}
      <div 
        ref={sidebarRef}
        className="w-full h-full bg-zk-offwhite dark:bg-zk-black border-r border-zk-graymed dark:border-zk-charcoal flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="h-12 px-4 border-b border-zk-graymed dark:border-zk-charcoal flex items-center gap-2 text-zk-charcoal dark:text-zk-graydark uppercase tracking-wide text-xs font-bold font-sans">
          <AlignLeft size={14} />
          <span>Table of Contents</span>
        </div>

        {/* Heading List */}
        <div className="flex-1 overflow-y-auto px-0 py-4 space-y-0 scroll-smooth">
          {headings.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zk-graydark dark:text-zk-graystd italic p-4 text-center font-sans">
              No headings in document
            </div>
          ) : (
            headings.map((item, index) => {
              const isActive = item.slug === activeSlug;
              
              // Custom indent class depending on h1, h2, h3 level
              let indentClass = 'pl-4';
              if (item.level === 2) indentClass = 'pl-8';
              if (item.level === 3) indentClass = 'pl-12';
              if (item.level > 3) indentClass = 'pl-16';

              return (
                <button
                  key={`${item.slug}-${index}`}
                  onClick={() => onItemClick(item.slug)}
                  className={`w-full text-left py-1.5 pr-4 rounded-none text-xs leading-normal font-mono transition-colors truncate block ${indentClass} ${
                    isActive
                      ? 'text-zk-black bg-[var(--rig-accent-primary)] font-bold'
                      : 'text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-white dark:hover:bg-zk-charcoal font-medium'
                  }`}
                >
                  {item.text}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Resize Handle Splitter Line */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onWidthChange(240)} // Double click resets to 240px
        className={`absolute top-0 right-0 w-[4px] h-full cursor-ew-resize hover:bg-zk-neon/50 transition-colors z-20 ${
          isResizing ? 'bg-zk-neon' : 'bg-transparent'
        }`}
      />
    </div>
  );
};
