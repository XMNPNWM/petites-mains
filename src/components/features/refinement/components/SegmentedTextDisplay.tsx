
import React, { useRef, useEffect, useState } from 'react';

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
  const [processedContent, setProcessedContent] = useState(content);

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

  // Handle highlighting in plain text
  useEffect(() => {
    if (!highlightedRange || !content) {
      setProcessedContent(content);
      return;
    }

    console.log('🎨 Applying highlight to original text range:', highlightedRange);

    const { start, end } = highlightedRange;
    
    // Validate range
    if (start < 0 || end > content.length || start >= end) {
      setProcessedContent(content);
      return;
    }

    // Extract parts
    const beforeHighlight = content.substring(0, start);
    const highlightedText = content.substring(start, end);
    const afterHighlight = content.substring(end);

    // Create highlighted content with HTML
    const highlightedContent = 
      escapeHtml(beforeHighlight) +
      `<span class="bg-yellow-300 border-2 border-yellow-400 rounded px-1 animate-pulse">${escapeHtml(highlightedText)}</span>` +
      escapeHtml(afterHighlight);

    setProcessedContent(highlightedContent);

    // Clear highlight after 5 seconds
    const timer = setTimeout(() => {
      setProcessedContent(content);
    }, 5000);

    return () => clearTimeout(timer);
  }, [highlightedRange, content]);

  // Simple HTML escape function
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto prose-sm max-w-none p-4 text-sm leading-relaxed"
    >
      <div 
        className="whitespace-pre-wrap leading-relaxed break-words text-sm"
        style={{ lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
};

export default SegmentedTextDisplay;
