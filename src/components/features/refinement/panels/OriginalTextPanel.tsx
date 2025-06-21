
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface OriginalTextPanelProps {
  content: string;
  chapterTitle: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number };
}

const OriginalTextPanel = ({ 
  content, 
  chapterTitle, 
  onScrollSync, 
  scrollPosition,
  highlightedRange 
}: OriginalTextPanelProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollSync && contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    }
  };

  // Sync scroll position when it changes externally
  useEffect(() => {
    if (scrollPosition !== undefined && contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const renderContentWithHighlight = () => {
    if (!content) return null;
    
    if (highlightedRange) {
      const before = content.substring(0, highlightedRange.start);
      const highlighted = content.substring(highlightedRange.start, highlightedRange.end);
      const after = content.substring(highlightedRange.end);
      
      return (
        <>
          {before}
          <span className="bg-yellow-200 px-1 rounded">{highlighted}</span>
          {after}
        </>
      );
    }
    
    return content;
  };

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Original Text</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Reference version from Creation Mode
        </p>
      </div>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">
            {chapterTitle || 'No chapter selected'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div 
            ref={contentRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="prose prose-sm max-w-none">
              {content ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {renderContentWithHighlight()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OriginalTextPanel;
