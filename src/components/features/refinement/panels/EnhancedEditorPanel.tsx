
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import EditableSegmentedDisplay from '../components/EditableSegmentedDisplay';
import EnhancedRichTextToolbar from '../components/EnhancedRichTextToolbar';
import EnhancedFindReplaceBar from '../components/EnhancedFindReplaceBar';

interface EnhancedEditorPanelProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  isEnhancing?: boolean;
  onEnhanceChapter?: () => void;
  hasEnhancedContent?: boolean;
}

const EnhancedEditorPanel = ({
  content,
  onContentChange,
  chapterTitle,
  onScrollSync,
  scrollPosition,
  isEnhancing = false,
  onEnhanceChapter,
  hasEnhancedContent = false
}: EnhancedEditorPanelProps) => {
  const [editor, setEditor] = useState<any>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Enhanced Header with Toolbar and Enhance Button */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="font-semibold text-slate-800">Enhanced Content</h3>
            
            {/* Enhance Chapter Button */}
            {onEnhanceChapter && (
              <Button
                onClick={onEnhanceChapter}
                disabled={isEnhancing}
                variant={hasEnhancedContent ? "outline" : "default"}
                size="sm"
                className="flex items-center space-x-2"
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isEnhancing 
                    ? 'Enhancing...' 
                    : hasEnhancedContent 
                      ? 'Re-enhance Chapter' 
                      : 'Enhance Chapter'
                  }
                </span>
              </Button>
            )}
          </div>

          <EnhancedRichTextToolbar 
            editor={editor}
            onFindReplaceToggle={() => setShowFindReplace(!showFindReplace)}
            disabled={isEnhancing}
          />
        </div>
        {showFindReplace && (
          <div className="mt-2">
            <EnhancedFindReplaceBar
              editor={editor}
              onClose={() => setShowFindReplace(false)}
              disabled={isEnhancing}
            />
          </div>
        )}
      </div>

      {/* Editor Container with Semi-transparent Overlay */}
      <div className="flex-1 overflow-hidden relative">
        <Card className="m-4 h-[calc(100%-2rem)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EditableSegmentedDisplay
              content={content}
              onContentChange={onContentChange}
              onScrollSync={onScrollSync}
              scrollPosition={scrollPosition}
              placeholder="Enhanced content will appear here..."
              onEditorReady={setEditor}
              linesPerPage={25}
              readOnly={isEnhancing}
            />
          </div>
        </Card>

        {/* Semi-transparent Overlay during Enhancement */}
        {isEnhancing && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg border flex flex-col items-center space-y-4 max-w-md">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-lg font-medium text-slate-800">Enhancing Chapter</span>
              </div>
              <p className="text-sm text-slate-600 text-center">
                AI is analyzing and enhancing your content. This may take a few moments...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedEditorPanel;
