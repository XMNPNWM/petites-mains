
import React, { useRef, useEffect } from 'react';
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
  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Original Header - Match Enhanced Header Structure */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between min-h-[32px]">
          <h3 className="font-semibold text-slate-800">Original Content</h3>
          {/* Empty div to match Enhanced panel structure */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-hidden">
        <Card className="m-4 h-[calc(100%-2rem)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SegmentedTextDisplay
              content={content}
              onScrollSync={onScrollSync}
              scrollPosition={scrollPosition}
              highlightedRange={highlightedRange}
              wordsPerPage={300}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OriginalTextPanel;
