
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface OriginalTextPanelProps {
  content: string;
  chapterTitle: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number } | null;
}

const OriginalTextPanel = ({
  content,
  chapterTitle,
  onScrollSync,
  scrollPosition,
  highlightedRange
}: OriginalTextPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll synchronization
  const handleScroll = () => {
    if (scrollContainerRef.current && onScrollSync) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    }
  };

  // Apply scroll position from external sync
  useEffect(() => {
    if (scrollContainerRef.current && scrollPosition !== undefined) {
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Handle highlighting
  const renderContentWithHighlight = () => {
    if (!highlightedRange || !content) {
      return <div className="whitespace-pre-wrap leading-relaxed break-words">{content}</div>;
    }

    const before = content.slice(0, highlightedRange.start);
    const highlighted = content.slice(highlightedRange.start, highlightedRange.end);
    const after = content.slice(highlightedRange.end);

    return (
      <div className="whitespace-pre-wrap leading-relaxed break-words">
        {before}
        <span className="bg-yellow-200 px-1 rounded animate-pulse">
          {highlighted}
        </span>
        {after}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 truncate">Original Content</h3>
          <span className="text-sm text-slate-500 truncate ml-2">{chapterTitle}</span>
        </div>
      </div>

      {/* Content Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <Card className="m-4 flex-1 min-h-0">
          <div ref={textContainerRef} className="p-6 h-full overflow-hidden">
            <div className="text-slate-700 text-sm leading-relaxed h-full overflow-y-auto">
              {renderContentWithHighlight()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OriginalTextPanel;
