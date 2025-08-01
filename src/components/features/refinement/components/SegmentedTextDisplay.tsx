
import React, { useRef, useEffect } from 'react';

interface SegmentedTextDisplayProps {
  content: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number } | null;
  linesPerPage?: number; // Keep for compatibility but ignore
}

const SegmentedTextDisplay = ({
  content,
  onScrollSync,
  scrollPosition,
  highlightedRange,
  linesPerPage = 25 // Ignored parameter for backward compatibility
}: SegmentedTextDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape HTML to prevent XSS attacks
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Handle scroll synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollSync) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

  // Listen for external scroll sync events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleExternalSync = (event: CustomEvent) => {
      const { sourcePanel, scrollRatio } = event.detail;
      
      if (sourcePanel === 'original') return;

      const { scrollHeight, clientHeight } = container;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      container.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, []);

  // Apply external scroll position
  useEffect(() => {
    if (scrollPosition !== undefined && containerRef.current) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Generate highlighted content with XSS protection
  const getHighlightedContent = () => {
    if (!highlightedRange || !content) return escapeHtml(content);
    
    const { start, end } = highlightedRange;
    const before = escapeHtml(content.slice(0, start));
    const highlighted = escapeHtml(content.slice(start, end));
    const after = escapeHtml(content.slice(end));
    
    return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800/40 px-1 rounded transition-all duration-300">${highlighted}</mark>${after}`;
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto prose-sm max-w-none p-4 text-sm leading-relaxed"
    >
      <div 
        className="whitespace-pre-wrap leading-relaxed break-words text-sm"
        style={{ lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
      />
    </div>
  );
};

export default SegmentedTextDisplay;
