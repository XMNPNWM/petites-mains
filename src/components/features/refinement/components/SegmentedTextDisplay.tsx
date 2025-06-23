
import React, { useRef, useEffect } from 'react';
import { useTextSegmentation } from '@/hooks/useTextSegmentation';

interface SegmentedTextDisplayProps {
  content: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number } | null;
  wordsPerPage?: number;
}

const SegmentedTextDisplay = ({
  content,
  onScrollSync,
  scrollPosition,
  highlightedRange,
  wordsPerPage = 300
}: SegmentedTextDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const segments = useTextSegmentation(content, wordsPerPage);

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
      
      // Don't sync if this panel is the source
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

  const shouldShowSegmented = segments.length > 1;

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto prose-sm max-w-none p-4 text-sm leading-relaxed"
    >
      {shouldShowSegmented ? (
        <div className="space-y-8">
          {segments.map((segment, index) => (
            <div key={index} className="min-h-[400px] border-b border-slate-100 pb-6 last:border-b-0">
              <div className="text-xs text-slate-400 mb-2 text-right">Page {segment.pageNumber}</div>
              <div 
                className="whitespace-pre-wrap leading-relaxed break-words text-sm"
                dangerouslySetInnerHTML={{ __html: segment.content }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div 
          className="whitespace-pre-wrap leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default SegmentedTextDisplay;
