
import React, { useRef, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { stripHtmlTags, getWordCount } from '@/lib/contentUtils';
import FocusModeToggle from './FocusModeToggle';
import FormattingToolbar from './FormattingToolbar';
import VisualDisplayLayer from './VisualDisplayLayer';
import { useVisualTextEditor } from '@/hooks/useVisualTextEditor';
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
  const [selectedTextContext, setSelectedTextContext] = useState<SelectedTextContext | null>(null);
  
  const cleanContent = chapter?.content ? stripHtmlTags(chapter.content) : '';
  const wordCount = getWordCount(cleanContent);

  const {
    content,
    scrollPosition,
    textareaRef,
    handleContentChange,
    handleScroll,
    handleInput
  } = useVisualTextEditor(cleanContent);

  // Update parent when content changes
  React.useEffect(() => {
    if (content !== cleanContent) {
      onContentChange(content);
    }
  }, [content, cleanContent, onContentChange]);

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

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInput(e);
  }, [handleInput]);

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
              
              <div className="flex items-center space-x-4">
                <FormattingToolbar
                  textareaRef={textareaRef}
                  content={content}
                  onContentChange={handleContentChange}
                />
                {onFocusToggle && (
                  <FocusModeToggle 
                    areMinimized={areMinimized} 
                    onToggle={onFocusToggle} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="h-full flex flex-col relative">
                  {/* Stable container for both layers */}
                  <div className="relative flex-1 min-h-0" style={{ isolation: 'isolate' }}>
                    {/* Visual Display Layer */}
                    <VisualDisplayLayer
                      content={content}
                      textareaRef={textareaRef}
                      scrollTop={scrollPosition.top}
                      scrollLeft={scrollPosition.left}
                    />
                    
                    {/* Editable Textarea Layer */}
                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleTextareaChange}
                      onScroll={handleScroll}
                      onSelect={handleSelectionChange}
                      onKeyUp={handleSelectionChange}
                      onMouseUp={handleSelectionChange}
                      placeholder="Start writing your story..."
                      className="absolute inset-0 resize-none border-none focus-visible:ring-0 text-base leading-relaxed bg-transparent z-0 p-3"
                      style={{ 
                        color: 'transparent',
                        caretColor: 'rgb(15 23 42)', // slate-900
                        backgroundColor: 'transparent',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      spellCheck={true}
                    />
                  </div>
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
