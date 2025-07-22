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
  const [lastNavigatedRangeId, setLastNavigatedRangeId] = useState<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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

  // DOM-based fallback scrolling when TipTap scrolling fails
  const scrollToCharacterDOMFallback = useCallback((charPosition: number) => {
    const editorContainer = editorContainerRef.current;
    if (!editorContainer) return false;

    try {
      // Find the ProseMirror editor element
      const proseMirrorElement = editorContainer.querySelector('.ProseMirror');
      if (!proseMirrorElement) return false;

      // Create a range to find the DOM position
      const walker = document.createTreeWalker(
        proseMirrorElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let node;
      const range = document.createRange();

      while (node = walker.nextNode()) {
        const textNode = node as Text;
        const nodeLength = textNode.textContent?.length || 0;
        
        if (currentPos + nodeLength >= charPosition) {
          const offsetInNode = charPosition - currentPos;
          range.setStart(textNode, Math.min(offsetInNode, nodeLength));
          range.setEnd(textNode, Math.min(offsetInNode, nodeLength));
          
          // Scroll the range into view
          range.getBoundingClientRect(); // Force layout
          
          // Scroll the editor container
          const rect = range.getBoundingClientRect();
          const containerRect = editorContainer.getBoundingClientRect();
          const scrollTop = rect.top - containerRect.top + editorContainer.scrollTop - 100;
          
          editorContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
          
          console.log('🧭 EditableSegmentedDisplay: DOM fallback scroll successful');
          return true;
        }
        
        currentPos += nodeLength;
      }
    } catch (e) {
      console.warn('DOM fallback scrolling failed:', e);
    }
    
    return false;
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

  // Improved navigation with better TipTap integration and DOM fallback
  const navigateToCharacterPosition = useCallback((charPosition: number, rangeId: string) => {
    if (!editor || !isEditorReady || isTransitioning) return;

    // Prevent duplicate navigation attempts
    if (lastNavigatedRangeId === rangeId) {
      console.log('🧭 EditableSegmentedDisplay: Skipping duplicate navigation to range:', rangeId);
      return;
    }

    console.log('🧭 EditableSegmentedDisplay: Navigating to character position:', charPosition, 'rangeId:', rangeId);

    // Clear any existing timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    if (navigationCooldownRef.current) {
      clearTimeout(navigationCooldownRef.current);
    }

    try {
      setIsNavigating(true);
      setLastNavigatedRangeId(rangeId);
      
      // Convert character position to TipTap position
      const tiptapPos = convertCharPositionToTipTap(editor, charPosition);
      
      console.log('🧭 EditableSegmentedDisplay: Converted positions - char:', charPosition, 'tiptap:', tiptapPos);
      
      // Try TipTap scrolling first
      let scrollSuccess = false;
      if (!editor.isDestroyed) {
        try {
          editor.chain()
            .setTextSelection({ from: tiptapPos, to: tiptapPos })
            .scrollIntoView()
            .run();
          scrollSuccess = true;
          console.log('🧭 EditableSegmentedDisplay: TipTap scroll successful');
        } catch (e) {
          console.warn('TipTap scrolling failed:', e);
        }
      }

      // Fallback to DOM-based scrolling if TipTap failed
      if (!scrollSuccess) {
        console.log('🧭 EditableSegmentedDisplay: Attempting DOM fallback scroll');
        scrollToCharacterDOMFallback(charPosition);
      }

      // Reset navigation flag after animation with extended timeout for range tracking
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        console.log('🧭 EditableSegmentedDisplay: Navigation completed for range:', rangeId);
        
        // Keep lastNavigatedRangeId for longer to prevent immediate re-navigation
        navigationCooldownRef.current = setTimeout(() => {
          setLastNavigatedRangeId(null);
          console.log('🧭 EditableSegmentedDisplay: Navigation cooldown ended for range:', rangeId);
        }, 2000); // Longer cooldown to prevent loops
      }, 600);
      
    } catch (e) {
      console.warn('Failed to navigate to character position:', e);
      setIsNavigating(false);
      setLastNavigatedRangeId(null);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, scrollToCharacterDOMFallback, lastNavigatedRangeId]);

  // Highlight text range in TipTap editor with improved logic
  const highlightTextRange = useCallback((start: number, end: number, rangeId: string) => {
    if (!editor || !isEditorReady || isTransitioning) return;

    // Prevent duplicate navigation attempts
    if (lastNavigatedRangeId === rangeId) {
      console.log('🧭 EditableSegmentedDisplay: Skipping duplicate highlight to range:', rangeId);
      return;
    }

    console.log('🧭 EditableSegmentedDisplay: Highlighting text range:', start, 'to', end, 'rangeId:', rangeId);

    // Clear any existing timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    if (navigationCooldownRef.current) {
      clearTimeout(navigationCooldownRef.current);
    }

    try {
      setIsNavigating(true);
      setLastNavigatedRangeId(rangeId);
      
      const fromPos = convertCharPositionToTipTap(editor, start);
      const toPos = convertCharPositionToTipTap(editor, end);
      
      console.log('🧭 EditableSegmentedDisplay: Converted highlight positions - from:', fromPos, 'to:', toPos);
      
      // Try TipTap highlighting and scrolling
      let scrollSuccess = false;
      if (!editor.isDestroyed) {
        try {
          editor.chain()
            .setTextSelection({ from: fromPos, to: toPos })
            .scrollIntoView()
            .run();
          scrollSuccess = true;
          console.log('🧭 EditableSegmentedDisplay: TipTap highlight and scroll successful');
        } catch (e) {
          console.warn('TipTap highlighting failed:', e);
        }
      }

      // Fallback to DOM-based scrolling if TipTap failed
      if (!scrollSuccess) {
        console.log('🧭 EditableSegmentedDisplay: Attempting DOM fallback scroll for highlight');
        scrollToCharacterDOMFallback(start);
      }

      // Reset navigation flag after animation
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        console.log('🧭 EditableSegmentedDisplay: Highlight navigation completed for range:', rangeId);
        
        // Keep lastNavigatedRangeId for longer to prevent immediate re-navigation
        navigationCooldownRef.current = setTimeout(() => {
          setLastNavigatedRangeId(null);
          console.log('🧭 EditableSegmentedDisplay: Highlight navigation cooldown ended for range:', rangeId);
        }, 2000); // Longer cooldown to prevent loops
      }, 600);
      
    } catch (e) {
      console.warn('Failed to highlight text range:', e);
      setIsNavigating(false);
      setLastNavigatedRangeId(null);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, scrollToCharacterDOMFallback, lastNavigatedRangeId]);

  // Reset editor ready state when transitioning
  useEffect(() => {
    if (isTransitioning) {
      setIsEditorReady(false);
      setEditor(null);
      setIsNavigating(false);
      setLastNavigatedRangeId(null);
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
      const rangeId = `${highlightedRange.start}-${highlightedRange.end}`;
      console.log('🧭 EditableSegmentedDisplay: Highlighted range changed:', rangeId, 'lastNavigated:', lastNavigatedRangeId);
      
      // Only navigate if this is a different range AND we're not in cooldown
      if (lastNavigatedRangeId !== rangeId) {
        highlightTextRange(highlightedRange.start, highlightedRange.end, rangeId);
      } else {
        console.log('🧭 EditableSegmentedDisplay: Skipping - same range as last navigation');
      }
    }
  }, [highlightedRange?.start, highlightedRange?.end, isNavigating, isTransitioning, lastNavigatedRangeId]); // More specific dependencies

  // Handle scroll position navigation with improved logic
  useEffect(() => {
    if (scrollPosition !== undefined && !isNavigating && !isTransitioning) {
      const positionId = `scroll-${scrollPosition}`;
      console.log('🧭 EditableSegmentedDisplay: Scroll position changed:', scrollPosition, 'positionId:', positionId, 'lastNavigated:', lastNavigatedRangeId);
      
      // Only navigate if this is a different position AND we're not in cooldown
      if (lastNavigatedRangeId !== positionId) {
        navigateToCharacterPosition(scrollPosition, positionId);
      } else {
        console.log('🧭 EditableSegmentedDisplay: Skipping - same position as last navigation');
      }
    }
  }, [scrollPosition, isNavigating, isTransitioning, lastNavigatedRangeId]); // More specific dependencies

  // Cleanup navigation timeouts on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (navigationCooldownRef.current) {
        clearTimeout(navigationCooldownRef.current);
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
