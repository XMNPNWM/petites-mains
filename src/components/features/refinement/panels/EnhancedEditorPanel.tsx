
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import SegmentedRichTextEditor from '../components/SegmentedRichTextEditor';
import EnhancedRichTextToolbar from '../components/EnhancedRichTextToolbar';
import EnhancedFindReplaceBar from '../components/EnhancedFindReplaceBar';

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
  const [editor, setEditor] = useState<any>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Enhanced Header with Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Enhanced Content</h3>
          <EnhancedRichTextToolbar 
            editor={editor}
            onFindReplaceToggle={() => setShowFindReplace(!showFindReplace)}
          />
        </div>
        {showFindReplace && (
          <div className="mt-2">
            <EnhancedFindReplaceBar
              editor={editor}
              onClose={() => setShowFindReplace(false)}
            />
          </div>
        )}
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <Card className="m-4 h-[calc(100%-2rem)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SegmentedRichTextEditor
              content={content}
              onContentChange={onContentChange}
              onScrollSync={onScrollSync}
              scrollPosition={scrollPosition}
              placeholder="Enhanced content will appear here..."
              onEditorReady={setEditor}
              wordsPerPage={300}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedEditorPanel;
