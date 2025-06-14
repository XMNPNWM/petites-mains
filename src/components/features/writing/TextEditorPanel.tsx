
import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import WritingContextMenu from './WritingContextMenu';
import { usePopupChat } from './PopupChatManager';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
}

interface TextEditorPanelProps {
  chapter: Chapter | null;
  onContentChange: (content: string) => void;
  areMinimized: boolean;
  onFocusToggle: () => void;
}

const TextEditorPanel = ({ 
  chapter, 
  onContentChange, 
  areMinimized, 
  onFocusToggle 
}: TextEditorPanelProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localContent, setLocalContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { createPopup } = usePopupChat();

  // Sync with chapter content
  useEffect(() => {
    if (chapter?.content !== undefined) {
      setLocalContent(chapter.content);
      setHasUnsavedChanges(false);
    }
  }, [chapter?.content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setHasUnsavedChanges(true);
    onContentChange(newContent);
  };

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      (window as any).selectedTextContext = {
        text: selectedText,
        start,
        end
      };
    } else {
      (window as any).selectedTextContext = null;
    }
  };

  const handleMenuClick = (type: 'comment' | 'chat', position: { x: number; y: number }, selectedText?: string) => {
    if (!chapter) return;
    
    const textarea = textareaRef.current;
    let lineNumber: number | undefined;
    
    if (textarea) {
      const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
      lineNumber = textBeforeCursor.split('\n').length;
    }
    
    createPopup(type, position, chapter.id, selectedText, lineNumber);
  };

  const wordCount = localContent.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="font-semibold text-slate-900">
            {chapter?.title || 'No Chapter Selected'}
          </h2>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-slate-600">
              {wordCount} words
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 flex items-center">
                <Save className="w-3 h-3 mr-1" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onFocusToggle}
          title={areMinimized ? "Show panels" : "Hide panels"}
        >
          {areMinimized ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <WritingContextMenu onComment={handleMenuClick} onChat={handleMenuClick}>
          <Card className="h-full border-none rounded-none shadow-none">
            <Textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              onSelect={handleTextSelection}
              placeholder={chapter ? "Start writing your chapter..." : "Select a chapter to begin writing"}
              className="h-full resize-none border-none rounded-none text-base leading-relaxed p-6 focus:ring-0 focus:border-none"
              disabled={!chapter}
              style={{
                fontFamily: 'Georgia, serif',
                lineHeight: '1.8'
              }}
            />
          </Card>
        </WritingContextMenu>
      </div>
    </div>
  );
};

export default TextEditorPanel;
