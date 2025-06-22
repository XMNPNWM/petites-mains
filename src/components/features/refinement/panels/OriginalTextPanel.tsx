
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import SegmentedTextDisplay from '../components/SegmentedTextDisplay';

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

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <h3 className="font-semibold text-slate-800">Original Content</h3>
      </div>

      {/* Content Container with Segmentation */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <Card className="m-4 flex-1 min-h-0">
          <div className="p-6 h-full overflow-hidden">
            <div className="text-slate-700 text-sm leading-relaxed h-full overflow-y-auto">
              <SegmentedTextDisplay 
                content={content}
                highlightedRange={highlightedRange}
                wordsPerPage={300}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OriginalTextPanel;
