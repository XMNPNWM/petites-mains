
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';

interface EnhancedEditorPanelProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
}

const EnhancedEditorPanel = ({
  content,
  onContentChange,
  chapterTitle,
  onScrollSync,
  scrollPosition
}: EnhancedEditorPanelProps) => {
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
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Enhanced Content</h3>
          <span className="text-sm text-slate-500">{chapterTitle}</span>
        </div>
      </div>

      {/* Editor Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <Card className="m-4 h-[calc(100%-2rem)]">
          <div className="p-4 h-full">
            <RichTextEditor
              content={content}
              onContentChange={onContentChange}
              onScrollSync={onScrollSync}
              scrollPosition={scrollPosition}
              placeholder="Enhanced content will appear here..."
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedEditorPanel;
