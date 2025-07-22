
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  linesPerPage?: number;
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
  linesPerPage = 25,
  readOnly = false,
  chapterKey,
  isLoading = false,
  isTransitioning = false
}: EditableSegmentedDisplayProps) => {
  const [editor, setEditor] = useState<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified character position to scroll calculation using DOM traversal
  const scrollToCharacterPosition = useCallback((charPosition: number) => {
    const container = editorContainerRef.current;
    if (!container || isNavigating) return;

    console.log('🧭 EditableSegmentedDisplay: Navigating to character position:', charPosition);

    setIsNavigating(true);

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    try {
      // Find the ProseMirror editor element
      const proseMirrorElement = container.querySelector('.ProseMirror');
      if (!proseMirrorElement) {
        console.warn('ProseMirror element not found');
        setIsNavigating(false);
        return;
      }

      // Get text content and calculate rough scroll position
      const textContent = proseMirrorElement.textContent || '';
      const totalLength = textContent.length;
      
      if (totalLength === 0 || charPosition >= totalLength) {
        console.warn('Invalid character position or empty content');
        setIsNavigating(false);
        return;
      }

      // Calculate scroll position as a percentage of content height
      const scrollPercentage = charPosition / totalLength;
      const maxScrollTop = proseMirrorElement.scrollHeight - container.clientHeight;
      const targetScrollTop = Math.max(0, scrollPercentage * maxScrollTop);

      console.log('🧭 EditableSegmentedDisplay: Calculated scroll position:', {
        charPosition,
        totalLength,
        scrollPercentage,
        targetScrollTop
      });

      // Scroll to the calculated position
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });

      // Try TipTap selection if editor is available
      if (editor && !editor.isDestroyed) {
        try {
          // Simple approach: try to set cursor position
          const doc = editor.state.doc;
          const maxPos = doc.content.size;
          const safePos = Math.min(charPosition + 1, maxPos); // +1 for TipTap positioning
          
          editor.chain()
            .setTextSelection({ from: safePos, to: safePos })
            .focus()
            .run();
            
          console.log('🧭 EditableSegmentedDisplay: TipTap selection set to position:', safePos);
        } catch (e) {
          console.warn('TipTap selection failed:', e);
        }
      }

    } catch (error) {
      console.error('Navigation failed:', error);
    }

    // Reset navigation flag after a delay
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      console.log('🧭 EditableSegmentedDisplay: Navigation completed');
    }, 1000);
  }, [editor, isNavigating]);

  // Enhanced editor ready handler
  const handleEditorReady = useCallback((editorInstance: any) => {
    if (!editorInstance || editorInstance.isDestroyed) return;
    
    console.log('EditableSegmentedDisplay: Editor ready for chapter:', chapterKey);
    setEditor(editorInstance);
    setIsEditorReady(true);
    
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
    if (!highlightedRange || isNavigating || isTransitioning || !isEditorReady) return;
    
    console.log('🧭 EditableSegmentedDisplay: New highlighted range detected:', highlightedRange);
    scrollToCharacterPosition(highlightedRange.start);
  }, [highlightedRange?.start, highlightedRange?.end, isNavigating, isTransitioning, isEditorReady, scrollToCharacterPosition]);

  // Handle scroll position navigation
  useEffect(() => {
    if (scrollPosition === undefined || isNavigating || isTransitioning || !isEditorReady) return;
    
    console.log('🧭 EditableSegmentedDisplay: New scroll position detected:', scrollPosition);
    scrollToCharacterPosition(scrollPosition);
  }, [scrollPosition, isNavigating, isTransitioning, isEditorReady, scrollToCharacterPosition]);

  // Cleanup navigation timeouts on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <EditorStylesProvider>
        <div className="flex-1 flex flex-col relative h-full" ref={editorContainerRef}>
          {!readOnly && editor && isEditorReady && (
            <RichTextBubbleMenu 
              editor={editor} 
              isTransitioning={isTransitioning}
            />
          )}
          <ScrollSyncHandler onScrollSync={onScrollSync} scrollPosition={scrollPosition}>
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
