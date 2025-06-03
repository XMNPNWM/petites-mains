
import React, { useState, useRef } from 'react';
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
  const [selectedText, setSelectedText] = useState<SelectedTextContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const cleanContent = chapter?.content ? stripHtmlTags(chapter.content) : '';
  const wordCount = getWordCount(cleanContent);

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
  };

  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      setSelectedText({
        text: selectedText.trim(),
        startOffset: start,
        endOffset: end
      });
    } else {
      setSelectedText(null);
    }
  };

  // Store selected text in a way that can be accessed by context menu
  React.useEffect(() => {
    if (selectedText) {
      // Store in a global way that WritingContextMenu can access
      (window as any).selectedTextContext = selectedText;
    } else {
      (window as any).selectedTextContext = null;
    }
  }, [selectedText]);

  // Handle context menu on textarea - allow it to bubble up
  const handleTextareaContextMenu = (e: React.MouseEvent) => {
    // Don't prevent default here - let it bubble up to WritingContextMenu
    // Just ensure we capture the current selection
    handleTextSelection();
  };

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col overflow-hidden">
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
                  {selectedText && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Selected: "{selectedText.text}"
                    </span>
                  )}
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
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
              <Textarea
                ref={textareaRef}
                value={cleanContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleTextSelection}
                onMouseUp={handleTextSelection}
                onContextMenu={handleTextareaContextMenu}
                placeholder="Start writing your story..."
                className="flex-1 resize-none border-none focus-visible:ring-0 text-base leading-relaxed overflow-y-auto"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center overflow-hidden">
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
