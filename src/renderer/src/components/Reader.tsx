import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkEmoji from 'remark-emoji';
import 'katex/dist/katex.min.css';
import 'prismjs';
const Prism = (window as any).Prism;
import { Copy, Check, FileText, Info, Lightbulb, AlertTriangle, AlertOctagon } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
});

const MermaidRenderer = ({ chart, isDark }: { chart: string, isDark: boolean }) => {
  const [svg, setSvg] = React.useState<string>('');

  React.useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
        });
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: svgCode } = await mermaid.render(id, chart);
        if (isMounted) setSvg(svgCode);
      } catch (e) {
        console.error('Mermaid render error', e);
        if (isMounted) setSvg(`<div class="text-red-500 font-mono text-sm p-4">Error rendering diagram</div>`);
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart, isDark]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

// Import Prism language components for fast, synchronous syntax highlighting
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';

interface ReaderProps {
  markdown: string;
  filePath: string | null;
  zoom: number;
  isDark: boolean;
}

// Robust slugify helper to match outline anchors
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-'); 
};

// Relative image path resolver that supports local files securely
export const resolveImagePath = (src: string, filePath: string | null): string => {
  if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  if (!filePath) return src;

  try {
    // Extract parent directory path from filepath
    const lastSlashIdx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    const parentDir = filePath.substring(0, lastSlashIdx + 1);

    // Format for web-safe URL path resolution (replace backslashes)
    let base = parentDir.replace(/\\/g, '/');
    if (!base.endsWith('/')) base += '/';

    // Solve relative dots (e.g. "./img.png", "../img.png")
    const parts = src.split(/[\\/]/);
    const baseParts = base.split('/').filter(Boolean);

    for (const part of parts) {
      if (part === '.' || part === '') {
        continue;
      } else if (part === '..') {
        baseParts.pop();
      } else {
        baseParts.push(part);
      }
    }

    const resolvedPath = baseParts.join('/');
    return `view-media://${resolvedPath}`;
  } catch (e) {
    console.error('Error resolving local image path:', e);
    return src;
  }
};

export const Reader: React.FC<ReaderProps> = ({ markdown, filePath, zoom, isDark }) => {
  
  // Re-run Prism highlighter triggers on content updates
  useEffect(() => {
    Prism.highlightAll();
  }, [markdown]);

  // Memoize custom components to prevent DOM destruction on re-renders
  const markdownComponents = React.useMemo(() => {
    const CodeBlock = ({ node, className, children, ...props }: any) => {
      const [copied, setCopied] = React.useState(false);
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      const lang = match ? match[1] : '';

      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(codeContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy code block:', err);
        }
      };

      const isInline = !match && !String(children).includes('\n');
      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      let highlightedHtml = '';
      try {
        const grammar = Prism.languages[lang] || Prism.languages.markup;
        highlightedHtml = Prism.highlight(codeContent, grammar, lang || 'markup');
      } catch (e) {
        highlightedHtml = codeContent;
      }

      if (lang === 'mermaid') {
        return (
          <div className="group/code relative my-8 rounded-lg overflow-hidden border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] shadow-rig-card-light dark:shadow-rig-card bg-zk-offwhite dark:bg-zk-black">
            <div className="h-10 px-4 flex items-center justify-between bg-zk-graylight dark:bg-zk-charcoal border-b border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] select-none">
              <span className="text-[11px] font-mono font-bold tracking-widest text-zk-charcoal dark:text-zk-white uppercase">
                MERMAID DIAGRAM
              </span>
            </div>
            <div className="p-6 flex justify-center bg-white dark:bg-zk-black overflow-x-auto">
               <MermaidRenderer chart={codeContent} isDark={isDark} />
            </div>
          </div>
        );
      }

      return (
        <div className="relative group my-6 font-sans">
          <div className="flex items-center justify-between px-4 py-2 bg-zk-graylight dark:bg-zk-charcoal rounded-t-lg border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] border-b-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zk-charcoal dark:text-zk-graylight">
              {lang || 'text'}
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] text-zk-charcoal dark:text-zk-graylight hover:text-zk-neon font-medium bg-white dark:bg-black px-2 py-1 rounded-sm shadow-sm border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] hover:shadow-offset-dark dark:hover:shadow-offset-neon hover:-translate-y-[2px]"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="m-0 border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] rounded-b-lg rounded-t-none bg-white dark:bg-black shadow-rig-card-light dark:shadow-rig-card">
            <code
              className={`block overflow-x-auto p-6 font-mono text-sm leading-relaxed text-zk-charcoal dark:text-zk-graylight language-${lang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        </div>
      );
    };

    const LinkComponent = ({ node, children, href, ...props }: any) => {
      const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!href) return;
        if (href.startsWith('#')) {
          e.preventDefault();
          const slug = href.substring(1);
          const element = document.getElementById(slug);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          e.preventDefault();
          window.electronAPI.openExternal(href);
        }
      };

      return (
        <a href={href} onClick={handleLinkClick} className="text-zk-neon hover:underline decoration-zk-neon/50 underline-offset-2" {...props}>
          {children}
        </a>
      );
    };

    const BlockquoteComponent = ({ node, children, ...props }: any) => {
      let alertType = '';
      const childrenArray = React.Children.toArray(children);
      const firstP = childrenArray[0] as any;
      
      if (firstP?.type === 'p') {
        const pChildren = React.Children.toArray(firstP.props.children);
        const firstText = pChildren[0];
        if (typeof firstText === 'string') {
          const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
          if (match) {
            alertType = match[1].toUpperCase();
            pChildren[0] = firstText.substring(match[0].length);
            childrenArray[0] = React.cloneElement(firstP, {}, ...pChildren);
          }
        }
      }

      if (alertType) {
        let icon, colorClasses, title;
        switch (alertType) {
          case 'NOTE':
            title = 'Note'; icon = <Info size={16} />; colorClasses = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'; break;
          case 'TIP':
            title = 'Tip'; icon = <Lightbulb size={16} />; colorClasses = 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'; break;
          case 'IMPORTANT':
            title = 'Important'; icon = <Info size={16} />; colorClasses = 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'; break;
          case 'WARNING':
            title = 'Warning'; icon = <AlertTriangle size={16} />; colorClasses = 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'; break;
          case 'CAUTION':
            title = 'Caution'; icon = <AlertOctagon size={16} />; colorClasses = 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'; break;
        }

        return (
          <div className={`my-6 border border-[var(--rig-border)] dark:border-[var(--rig-border-dark)] shadow-sm rounded-lg p-4 ${colorClasses} font-sans`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              {icon} <span>{title}</span>
            </div>
            <div className="opacity-90 leading-relaxed text-sm">
              {childrenArray}
            </div>
          </div>
        );
      }

      return (
        <blockquote className="border-l-4 border-zk-neon dark:border-zk-neon pl-4 py-2 italic opacity-90 my-6 bg-white dark:bg-zk-black shadow-sm rounded-r-lg font-sans" {...props}>
          {children}
        </blockquote>
      );
    };

    const createHeading = (level: number) => {
      const Heading = ({ node, children, ...props }: any) => {
        const text = React.Children.toArray(children)
          .map((child: any) => {
            if (typeof child === 'string') return child;
            if (child?.props?.children) return child.props.children;
            return '';
          })
          .join('');
          
        const slug = slugify(text);
        const Tag = `h${level}` as React.ElementType;
        
        return (
          <Tag 
            id={slug} 
            data-outline-heading=""
            data-heading-slug={slug}
            className="group relative scroll-mt-6"
            {...props}
          >
            {children}
          </Tag>
        );
      };
      return Heading;
    };

    const ImageComponent = ({ node, src, alt, ...props }: any) => {
      if (!src) return null;
      const resolvedSrc = resolveImagePath(src, filePath);
      
      return (
        <div className="flex flex-col items-center">
          <img 
            src={resolvedSrc} 
            alt={alt || 'Image'} 
            className="max-h-[500px] object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.style.display = 'none';
              const placeholder = target.nextSibling as HTMLDivElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
            {...props} 
          />
          <div 
            style={{ display: 'none' }}
            className="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-xl flex-col items-center gap-2 justify-center bg-slate-50/20 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500 font-medium py-8"
          >
            <FileText size={24} className="opacity-60" />
            <span className="text-xs">Image could not be loaded</span>
            <span className="text-[10px] font-mono text-slate-350 dark:text-slate-600 truncate max-w-[320px]" title={src}>
              {src}
            </span>
          </div>
          {alt && (
            <span className="text-xs text-slate-450 dark:text-slate-500 mt-2 italic">
              {alt}
            </span>
          )}
        </div>
      );
    };

    return {
      pre: ({ children }: any) => <>{children}</>,
      code: CodeBlock,
      a: LinkComponent,
      img: ImageComponent,
      blockquote: BlockquoteComponent,
      h1: createHeading(1),
      h2: createHeading(2),
      h3: createHeading(3),
      h4: createHeading(4),
      h5: createHeading(5),
      h6: createHeading(6),
    };
  }, [filePath, isDark]);

  // Parse Frontmatter manually to avoid build issues with gray-matter in some Vite setups
  let displayMarkdown = markdown;
  let frontmatter: Record<string, string> | null = null;
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = markdown.match(frontmatterRegex);
  
  if (match && match.index === 0) {
    displayMarkdown = markdown.substring(match[0].length);
    frontmatter = {};
    match[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        frontmatter![key] = val;
      }
    });
  }

  return (
    <div 
      className="flex-1 overflow-y-auto px-8 sm:px-12 md:px-20 py-8 scroll-smooth bg-zk-white dark:bg-zk-black"
      style={{ fontSize: `${(zoom / 100) * 16}px` }}
    >
      <div className="w-full max-w-[1200px] mx-auto markdown-prose text-zk-charcoal dark:text-zk-graylight leading-relaxed font-sans pb-32">
        {displayMarkdown.trim() === '' ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-zk-graydark dark:text-zk-graystd">
            <FileText size={48} className="opacity-30 mb-4 animate-pulse" />
            <span className="text-sm font-medium font-sans">Empty Markdown Document</span>
            <span className="text-xs opacity-60 mt-1 font-sans">Add headers or text content to start reading</span>
          </div>
        ) : (
          <>
            {frontmatter && (
              <div className="mb-10 bg-zk-offwhite dark:bg-zk-charcoal/30 border border-zk-graymed dark:border-zk-charcoal p-6 shadow-sm rounded-none">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zk-graydark dark:text-zk-graystd mb-4 flex items-center gap-2 border-b border-zk-graylight dark:border-zk-charcoal/50 pb-2">
                  <Database size={14} /> Document Metadata
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(frontmatter).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-zk-graydark dark:text-zk-graystd uppercase">{key}</span>
                      <span className="text-sm font-medium text-zk-black dark:text-zk-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {displayMarkdown}
            </ReactMarkdown>
          </>
        )}
      </div>
    </div>
  );
};
