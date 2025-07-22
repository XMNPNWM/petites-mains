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
  const [lastNavigatedRange, setLastNavigatedRange] = useState<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert plain text character position to TipTap document position
  const convertCharPositionToTipTap = useCallback((editor: any, charPosition: number): number => {
    if (!editor || editor.isDestroyed) return 1;
    
    try {
      const doc = editor.state.doc;
      let currentPos = 0;
      let tiptapPos = 1; // TipTap positions start at 1
      
      // Walk through document nodes to find character mapping
      doc.descendants((node: any, pos: number) => {
        if (node.isText) {
          const nodeLength = node.text?.length || 0;
          if (currentPos + nodeLength >= charPosition) {
            tiptapPos = pos + (charPosition - currentPos) + 1;
            return false; // Stop iteration
          }
          currentPos += nodeLength;
        }
        return true;
      });
      
      return Math.min(tiptapPos, doc.content.size);
    } catch (e) {
      console.warn('Failed to convert character position to TipTap:', e);
      return 1;
    }
  }, []);

  // Enhanced editor ready handler with better stability
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

  // Improved navigation with lifecycle awareness and duplicate prevention
  const navigateToCharacterPosition = useCallback((charPosition: number, rangeKey: string) => {
    if (!editor || !isEditorReady || isTransitioning || lastNavigatedRange === rangeKey) return;

    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    try {
      setIsNavigating(true);
      setLastNavigatedRange(rangeKey);
      
      // Convert character position to TipTap position
      const tiptapPos = convertCharPositionToTipTap(editor, charPosition);
      
      // Create selection and scroll into view with validation
      if (!editor.isDestroyed) {
        editor.chain()
          .setTextSelection({ from: tiptapPos, to: tiptapPos })
          .scrollIntoView()
          .run();
      }

      // Reset navigation flag after animation with extended timeout for range tracking
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        // Keep lastNavigatedRange for longer to prevent immediate re-navigation
        setTimeout(() => setLastNavigatedRange(null), 1000);
      }, 600);
      
    } catch (e) {
      console.warn('Failed to navigate to character position:', e);
      setIsNavigating(false);
      setLastNavigatedRange(null);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, lastNavigatedRange]);

  // Highlight text range in TipTap editor with improved logic
  const highlightTextRange = useCallback((start: number, end: number, rangeKey: string) => {
    if (!editor || !isEditorReady || isTransitioning || lastNavigatedRange === rangeKey) return;

    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    try {
      setIsNavigating(true);
      setLastNavigatedRange(rangeKey);
      
      const fromPos = convertCharPositionToTipTap(editor, start);
      const toPos = convertCharPositionToTipTap(editor, end);
      
      // Create selection and scroll into view
      if (!editor.isDestroyed) {
        editor.chain()
          .setTextSelection({ from: fromPos, to: toPos })
          .scrollIntoView()
          .run();
      }

      // Reset navigation flag after animation
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        // Keep lastNavigatedRange for longer to prevent immediate re-navigation
        setTimeout(() => setLastNavigatedRange(null), 1000);
      }, 600);
      
    } catch (e) {
      console.warn('Failed to highlight text range:', e);
      setIsNavigating(false);
      setLastNavigatedRange(null);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, lastNavigatedRange]);

  // Reset editor ready state when transitioning
  useEffect(() => {
    if (isTransitioning) {
      setIsEditorReady(false);
      setEditor(null);
      setIsNavigating(false);
      setLastNavigatedRange(null);
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

  // Handle highlighted range navigation with improved duplicate prevention
  useEffect(() => {
    if (highlightedRange && !isNavigating && !isTransitioning) {
      const rangeKey = `${highlightedRange.start}-${highlightedRange.end}`;
      if (lastNavigatedRange !== rangeKey) {
        highlightTextRange(highlightedRange.start, highlightedRange.end, rangeKey);
      }
    }
  }, [highlightedRange, highlightTextRange, isNavigating, isTransitioning, lastNavigatedRange]);

  // Handle scroll position navigation with improved logic
  useEffect(() => {
    if (scrollPosition !== undefined && !isNavigating && !isTransitioning) {
      const positionKey = `scroll-${scrollPosition}`;
      if (lastNavigatedRange !== positionKey) {
        navigateToCharacterPosition(scrollPosition, positionKey);
      }
    }
  }, [scrollPosition, navigateToCharacterPosition, isNavigating, isTransitioning, lastNavigatedRange]);

  // Cleanup navigation timeout on unmount
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
