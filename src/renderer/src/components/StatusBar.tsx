import React from 'react';
import { FileText } from 'lucide-react';

interface StatusBarProps {
  filePath: string | null;
  markdown: string;
  zoom: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ filePath, markdown, zoom }) => {
  // Count words, characters, and estimate reading time (standard 200 WPM)
  const cleanMarkdown = markdown.trim();
  const charCount = cleanMarkdown.length;
  
  // Count words ignoring double spaces and code brackets
  const words = cleanMarkdown
    ? cleanMarkdown
        .replace(/#+\s+/g, '') // remove heading tags
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // extract link text
        .split(/\s+/)
        .filter((w) => w.length > 0)
    : [];
    
  const wordCount = words.length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <footer className="h-7 w-full shrink-0 border-t border-zk-graymed dark:border-zk-charcoal bg-zk-offwhite dark:bg-zk-black px-4 flex items-center justify-between text-[11px] font-medium text-zk-charcoal dark:text-zk-graylight select-none z-30 font-sans">
      
      {/* File Path indicator */}
      <div className="truncate max-w-[50%] flex items-center gap-1.5" title={filePath || 'No active file'}>
        <span className="truncate">
          {filePath ? filePath : 'Ready to read Markdown documents'}
        </span>
      </div>

      {/* Stats and Zoom */}
      <div className="flex items-center gap-3 shrink-0">
        {cleanMarkdown && (
          <div className="flex items-center gap-2 border-r border-zk-graymed dark:border-zk-charcoal pr-3 text-zk-graydark dark:text-zk-graystd">
            <span>{wordCount} words</span>
            <span className="opacity-40">•</span>
            <span>{charCount} chars</span>
            <span className="opacity-40">•</span>
            <span>{readTime} min read</span>
          </div>
        )}
        
        <span className="font-mono text-zk-charcoal dark:text-zk-graylight">
          Zoom: {zoom}%
        </span>
      </div>
    </footer>
  );
};
