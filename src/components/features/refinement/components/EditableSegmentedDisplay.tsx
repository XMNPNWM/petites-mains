
import React, { useState, useCallback, useEffect } from 'react';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import EditorCore from './EditorCore';
import ScrollSyncHandler from './ScrollSyncHandler';
import ContentProcessor from './ContentProcessor';
import EditorStylesProvider from './EditorStylesProvider';
import ErrorBoundary from './ErrorBoundary';

interface EditableSegmentedDisplayProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number } | null;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  linesPerPage?: number; // Keep for compatibility but ignore
  readOnly?: boolean;
  chapterKey?: string;
  isLoading?: boolean;
  isTransitioning?: boolean;
}

const EditableSegmentedDisplay = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  highlightedRange,
  placeholder = "Start writing...",
  onEditorReady,
  linesPerPage = 25, // Ignored parameter for backward compatibility
  readOnly = false,
  chapterKey,
  isLoading = false,
  isTransitioning = false
}: EditableSegmentedDisplayProps) => {
  const [editor, setEditor] = useState<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Enhanced editor ready handler
  const handleEditorReady = useCallback((editorInstance: any) => {
    if (!editorInstance || editorInstance.isDestroyed) return;
    
    console.log('EditableSegmentedDisplay: Editor ready for chapter:', chapterKey);
    setEditor(editorInstance);
    setIsEditorReady(true);
    
    // Apply read-only state immediately if needed
    if (readOnly && !editorInstance.isDestroyed) {
      try {
        editorInstance.setEditable(!readOnly);
      } catch (e) {
        console.warn('Failed to set editor editable state on ready:', e);
      }
    }
    
    if (onEditorReady) {
      onEditorReady(editorInstance);
    }
  }, [readOnly, onEditorReady, chapterKey]);

  // DOM-based scroll to character position in TipTap editor
  const scrollToCharacterPosition = useCallback((charPosition: number) => {
    if (!editor || !isEditorReady || isTransitioning) return;

    try {
      setIsNavigating(true);
      
      // Convert character position to TipTap position
      const doc = editor.state.doc;
      const resolvedPos = Math.min(charPosition + 1, doc.content.size); // +1 for TipTap's positioning
      
      // Set text selection at the target position
      editor.commands.setTextSelection({ from: resolvedPos, to: resolvedPos });
      
      // Scroll the selection into view with animation
      editor.commands.scrollIntoView();

      // Reset navigation flag after animation
      setTimeout(() => setIsNavigating(false), 600);
      
    } catch (e) {
      console.warn('Failed to scroll to character position:', e);
      setIsNavigating(false);
    }
  }, [editor, isEditorReady, isTransitioning]);

  // Highlight text range in TipTap editor
  const highlightTextRange = useCallback((start: number, end: number) => {
    if (!editor || !isEditorReady || isTransitioning) return;

    try {
      setIsNavigating(true);
      
      const doc = editor.state.doc;
      const fromPos = Math.min(start + 1, doc.content.size);
      const toPos = Math.min(end + 1, doc.content.size);
      
      // Create selection and scroll into view
      editor.commands.setTextSelection({ from: fromPos, to: toPos });
      editor.commands.scrollIntoView();

      // Reset navigation flag after animation
      setTimeout(() => setIsNavigating(false), 600);
      
    } catch (e) {
      console.warn('Failed to highlight text range:', e);
      setIsNavigating(false);
    }
  }, [editor, isEditorReady, isTransitioning]);

  // Reset editor ready state when transitioning
  useEffect(() => {
    if (isTransitioning) {
      setIsEditorReady(false);
      setEditor(null);
      setIsNavigating(false);
    }
  }, [isTransitioning]);

  // Update read-only state
  useEffect(() => {
    if (editor && !editor.isDestroyed && isEditorReady && !isTransitioning) {
      try {
        editor.setEditable(!readOnly);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly, isEditorReady, isTransitioning]);

  // Handle highlighted range navigation
  useEffect(() => {
    if (highlightedRange && !isNavigating && !isTransitioning) {
      highlightTextRange(highlightedRange.start, highlightedRange.end);
    }
  }, [highlightedRange, highlightTextRange, isNavigating, isTransitioning]);

  // Handle scroll position navigation
  useEffect(() => {
    if (scrollPosition !== undefined && !isNavigating && !isTransitioning) {
      scrollToCharacterPosition(scrollPosition);
    }
  }, [scrollPosition, scrollToCharacterPosition, isNavigating, isTransitioning]);

  return (
    <ErrorBoundary>
      <EditorStylesProvider>
        <div className="flex-1 flex flex-col relative h-full">
          {!readOnly && editor && isEditorReady && (
            <RichTextBubbleMenu 
              editor={editor} 
              isTransitioning={isTransitioning}
            />
          )}
          <ScrollSyncHandler onScrollSync={onScrollSync} scrollPosition={scrollPosition}>
            {/* Use ContentProcessor but bypass linesPerPage for continuous content */}
            <ContentProcessor content={content || ""} linesPerPage={1}>
              {(processedContent) => (
                <ErrorBoundary key={`editor-${chapterKey}`}>
                  <EditorCore
                    key={`core-${chapterKey}`}
                    content={processedContent}
                    onContentChange={onContentChange}
                    onEditorReady={handleEditorReady}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    chapterKey={chapterKey}
                    isTransitioning={isTransitioning}
                    highlightedRange={highlightedRange}
                  />
                </ErrorBoundary>
              )}
            </ContentProcessor>
          </ScrollSyncHandler>
        </div>
      </EditorStylesProvider>
    </ErrorBoundary>
  );
};

export default EditableSegmentedDisplay;
