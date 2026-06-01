import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUp, ChevronDown, X, Search as SearchIcon } from 'lucide-react';

interface SearchProps {
  onClose: () => void;
  isOpen: boolean;
}

export const Search: React.FC<SearchProps> = ({ onClose, isOpen }) => {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store all ranges found in the document
  const matchesRef = useRef<Range[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setMatchCount(0);
      setCurrentIndex(0);
      matchesRef.current = [];
      clearHighlights();
    }
  }, [isOpen]);

  // Handle Ctrl+F when search is already open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (isOpen) {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  const clearHighlights = () => {
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
      (CSS as any).highlights.delete('search-match');
      (CSS as any).highlights.delete('search-active');
    }
  };

  // Re-calculates all matches in the DOM
  const computeMatches = (searchQuery: string) => {
    matchesRef.current = [];
    clearHighlights();

    if (!searchQuery.trim()) {
      setMatchCount(0);
      setCurrentIndex(0);
      return;
    }

    const container = document.querySelector('.markdown-prose');
    if (!container) return;

    // Create a TreeWalker to extract all text nodes
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        // Skip hidden elements or scripts
        const parent = node.parentElement;
        if (parent) {
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes: { node: Text, start: number, end: number }[] = [];
    let fullText = '';
    let currentNode;
    
    while ((currentNode = walker.nextNode())) {
      const text = currentNode.nodeValue || '';
      const start = fullText.length;
      fullText += text;
      textNodes.push({ node: currentNode as Text, start, end: fullText.length });
    }

    const lowerText = fullText.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let startIndex = 0;
    let matchIndex;
    const ranges: Range[] = [];

    while ((matchIndex = lowerText.indexOf(lowerQuery, startIndex)) !== -1) {
      const matchEnd = matchIndex + lowerQuery.length;
      
      const startNodeInfo = textNodes.find(n => n.start <= matchIndex && n.end > matchIndex);
      const endNodeInfo = textNodes.find(n => n.start < matchEnd && n.end >= matchEnd);
      
      if (startNodeInfo && endNodeInfo) {
        const range = document.createRange();
        range.setStart(startNodeInfo.node, matchIndex - startNodeInfo.start);
        range.setEnd(endNodeInfo.node, matchEnd - endNodeInfo.start);
        ranges.push(range);
      }
      
      startIndex = matchIndex + lowerQuery.length;
    }

    matchesRef.current = ranges;
    setMatchCount(ranges.length);
    
    if (ranges.length > 0) {
      setCurrentIndex(1); // 1-indexed
      applyHighlights(ranges, 1);
      scrollToMatch(ranges[0]);
    } else {
      setCurrentIndex(0);
    }
  };

  const applyHighlights = (ranges: Range[], activeIndex: number) => {
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
      // Highlight all matches
      const allHighlight = new (window as any).Highlight(...ranges);
      (CSS as any).highlights.set('search-match', allHighlight);
      
      // Highlight active match differently
      if (activeIndex > 0 && activeIndex <= ranges.length) {
        const activeHighlight = new (window as any).Highlight(ranges[activeIndex - 1]);
        (CSS as any).highlights.set('search-active', activeHighlight);
      }
    }
  };

  const scrollToMatch = (range: Range) => {
    const readerCanvas = document.querySelector('.markdown-prose')?.parentElement;
    if (!readerCanvas) return;
    
    const rect = range.getBoundingClientRect();
    const canvasRect = readerCanvas.getBoundingClientRect();
    
    // Calculate exact scroll position relative to the scrolling container
    const relativeTop = rect.top - canvasRect.top + readerCanvas.scrollTop;
    
    // Target position: Centers the exact word vertically in the scrollable view
    const targetY = relativeTop - (readerCanvas.clientHeight / 2) + (rect.height / 2);
    
    readerCanvas.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  const navigateMatch = (forward: boolean) => {
    const total = matchesRef.current.length;
    if (total === 0) return;

    setCurrentIndex((prev) => {
      let next = forward ? prev + 1 : prev - 1;
      if (next > total) next = 1;
      if (next < 1) next = total;
      
      applyHighlights(matchesRef.current, next);
      scrollToMatch(matchesRef.current[next - 1]);
      
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    computeMatches(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateMatch(!e.shiftKey);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-8 w-80 h-10 flex items-center justify-between gap-1 border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] bg-white dark:bg-zk-black px-2 py-1.5 rounded-md shadow-rig-card-light dark:shadow-rig-card select-none z-40 animate-scale-in">
      
      {/* Search Input Box */}
      <div className="flex-1 flex items-center gap-2 pl-2">
        <SearchIcon size={14} className="text-[var(--rig-text-ink)] opacity-70 font-bold" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search document..."
          className="w-full text-xs font-sans bg-transparent border-0 outline-none focus:ring-0 text-[var(--rig-text-ink)] placeholder-[var(--rig-text-ink)] placeholder-opacity-50"
        />
      </div>

      {/* Match counts */}
      {query.trim() && (
        <span className="text-[10px] font-bold text-zk-black bg-[var(--rig-accent-primary)] px-2 rounded-sm select-none py-0.5 border border-transparent shrink-0 font-mono tracking-widest">
          {matchCount > 0 ? `${currentIndex} / ${matchCount}` : '0'}
        </span>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        <button
          onClick={() => navigateMatch(false)}
          disabled={matchCount === 0}
          title="Previous Match (Shift+Enter)"
          className="p-1 rounded-sm text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-zk-graylight dark:hover:bg-zk-charcoal disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => navigateMatch(true)}
          disabled={matchCount === 0}
          title="Next Match (Enter)"
          className="p-1 rounded-sm text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-zk-graylight dark:hover:bg-zk-charcoal disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronDown size={14} />
        </button>
        <div className="w-[1px] h-3.5 bg-[var(--rig-border)] dark:bg-[var(--rig-border-dark)] mx-1" />
        <button
          onClick={onClose}
          title="Close search (Esc)"
          className="p-1 rounded-sm text-[var(--rig-text-ink)] opacity-70 hover:opacity-100 hover:bg-[var(--rig-accent-primary)] hover:text-zk-black transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
