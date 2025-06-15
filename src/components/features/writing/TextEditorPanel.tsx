
import React, { useRef, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { stripHtmlTags, getWordCount } from '@/lib/contentUtils';
import FocusModeToggle from './FocusModeToggle';
import { SelectedTextContext } from '@/types/comments';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface TextEditorPanelProps {
  chapter: Chapter | null;
  onContentChange: (content: string) => void;
  areMinimized?: boolean;
  onFocusToggle?: () => void;
}

const TextEditorPanel = ({ 
  chapter, 
  onContentChange, 
  areMinimized = false, 
  onFocusToggle 
}: TextEditorPanelProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTextContext, setSelectedTextContext] = useState<SelectedTextContext | null>(null);
  
  const cleanContent = chapter?.content ? stripHtmlTags(chapter.content) : '';
  const wordCount = getWordCount(cleanContent);

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
  };

  // Get current line number based on cursor position
  const getCurrentLineNumber = useCallback((): number => {
    if (!textareaRef.current) return 1;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lineNumber = textBeforeCursor.split('\n').length;
    
    return lineNumber;
  }, []);

  // Get selected text context
  const getSelectedTextContext = useCallback((): SelectedTextContext | null => {
    if (!textareaRef.current) return null;
    
    const textarea = textareaRef.current;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (!selectedText.trim()) return null;
    
    const lineNumber = getCurrentLineNumber();
    
    return {
      text: selectedText.trim(),
      startOffset: textarea.selectionStart,
      endOffset: textarea.selectionEnd,
      lineNumber
    };
  }, [getCurrentLineNumber]);

  // Update selected text context when selection changes
  const handleSelectionChange = useCallback(() => {
    const context = getSelectedTextContext();
    setSelectedTextContext(context);
    // Store in global for context menu access
    (window as any).selectedTextContext = context;
  }, [getSelectedTextContext]);

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col">
      {chapter ? (
        <>
          {/* Chapter Header */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{chapter.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>{wordCount} words</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    chapter.status === 'published' ? 'bg-green-100 text-green-700' :
                    chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chapter.status}
                  </span>
                </div>
              </div>
              {onFocusToggle && (
                <FocusModeToggle 
                  areMinimized={areMinimized} 
                  onToggle={onFocusToggle} 
                />
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Card className="h-full flex flex-col">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="h-full flex flex-col">
                  <Textarea
                    ref={textareaRef}
                    value={cleanContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onSelect={handleSelectionChange}
                    onKeyUp={handleSelectionChange}
                    onMouseUp={handleSelectionChange}
                    placeholder="Start writing your story..."
                    className="flex-1 resize-none border-none focus-visible:ring-0 text-base leading-relaxed h-full min-h-0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 text-lg mb-4">No chapter selected</p>
            <p className="text-slate-400">Select a chapter from the organizer to start writing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditorPanel;
