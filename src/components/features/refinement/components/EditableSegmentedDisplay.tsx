
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
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Improved TipTap character position conversion
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
        } else if (node.type.name === 'paragraph' || node.type.name === 'hardBreak') {
          // Account for paragraph breaks and line breaks
          if (currentPos <= charPosition) {
            currentPos += 1; // Add 1 for the break character
          }
        }
        return true;
      });
      
      return Math.min(tiptapPos, doc.content.size);
    } catch (e) {
      console.warn('Failed to convert character position to TipTap:', e);
      return 1;
    }
  }, []);

  // Improved DOM-based fallback scrolling
  const scrollToCharacterDOMFallback = useCallback((charPosition: number) => {
    const editorContainer = editorContainerRef.current;
    if (!editorContainer) return false;

    try {
      // Find the ProseMirror editor element
      const proseMirrorElement = editorContainer.querySelector('.ProseMirror');
      if (!proseMirrorElement) return false;

      // Create a temporary element to measure position
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.style.fontSize = window.getComputedStyle(proseMirrorElement).fontSize;
      tempDiv.style.lineHeight = window.getComputedStyle(proseMirrorElement).lineHeight;
      tempDiv.style.fontFamily = window.getComputedStyle(proseMirrorElement).fontFamily;
      tempDiv.style.width = proseMirrorElement.clientWidth + 'px';
      
      // Get text content up to the character position
      const textContent = proseMirrorElement.textContent || '';
      tempDiv.textContent = textContent.substring(0, charPosition);
      
      document.body.appendChild(tempDiv);
      const measuredHeight = tempDiv.offsetHeight;
      document.body.removeChild(tempDiv);
      
      // Scroll to the measured position
      const scrollTop = Math.max(0, measuredHeight - 100); // Offset for visibility
      editorContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      
      console.log('🧭 EditableSegmentedDisplay: DOM fallback scroll successful, scrollTop:', scrollTop);
      return true;
    } catch (e) {
      console.warn('DOM fallback scrolling failed:', e);
    }
    
    return false;
  }, []);

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

  // Improved navigation with better TipTap integration and enhanced fallback
  const navigateToCharacterPosition = useCallback((charPosition: number, rangeId: string) => {
    if (!editor || !isEditorReady || isTransitioning || isNavigating) return;

    console.log('🧭 EditableSegmentedDisplay: Navigating to character position:', charPosition, 'rangeId:', rangeId);

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    try {
      setIsNavigating(true);
      setLastNavigatedRange(rangeId);
      
      // Convert character position to TipTap position
      const tiptapPos = convertCharPositionToTipTap(editor, charPosition);
      
      console.log('🧭 EditableSegmentedDisplay: Converted positions - char:', charPosition, 'tiptap:', tiptapPos);
      
      let scrollSuccess = false;
      
      // Try TipTap scrolling first
      if (!editor.isDestroyed) {
        try {
          // Set selection and scroll into view
          editor.chain()
            .setTextSelection({ from: tiptapPos, to: tiptapPos })
            .focus()
            .scrollIntoView()
            .run();
          
          // Give TipTap a moment to scroll, then check if we need fallback
          setTimeout(() => {
            const editorElement = editorContainerRef.current?.querySelector('.ProseMirror');
            if (editorElement) {
              const selection = editor.state.selection;
              const resolvedPos = editor.state.doc.resolve(selection.from);
              
              // Try to get the DOM node at the selection
              const domPos = editor.view.domAtPos(resolvedPos.pos);
              if (domPos.node) {
                try {
                  const range = document.createRange();
                  if (domPos.node.nodeType === Node.TEXT_NODE) {
                    range.setStart(domPos.node, Math.min(domPos.offset, domPos.node.textContent?.length || 0));
                  } else {
                    range.selectNode(domPos.node);
                  }
                  
                  // Check if the element is in view
                  const rect = range.getBoundingClientRect();
                  const containerRect = editorContainerRef.current?.getBoundingClientRect();
                  
                  if (containerRect && (rect.top < containerRect.top || rect.bottom > containerRect.bottom)) {
                    // Element is not fully visible, use DOM fallback
                    console.log('🧭 EditableSegmentedDisplay: TipTap scroll incomplete, using DOM fallback');
                    scrollToCharacterDOMFallback(charPosition);
                  } else {
                    console.log('🧭 EditableSegmentedDisplay: TipTap scroll successful');
                  }
                } catch (rangeError) {
                  console.warn('Range-based scroll check failed:', rangeError);
                  scrollToCharacterDOMFallback(charPosition);
                }
              } else {
                scrollToCharacterDOMFallback(charPosition);
              }
            }
          }, 100); // Small delay to let TipTap complete its scroll
          
          scrollSuccess = true;
        } catch (e) {
          console.warn('TipTap scrolling failed:', e);
        }
      }

      // Immediate fallback if TipTap failed
      if (!scrollSuccess) {
        console.log('🧭 EditableSegmentedDisplay: TipTap failed, attempting immediate DOM fallback');
        scrollToCharacterDOMFallback(charPosition);
      }

      // Reset navigation flag after animation
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        console.log('🧭 EditableSegmentedDisplay: Navigation completed for range:', rangeId);
      }, 800); // Longer timeout to account for fallback delay
      
    } catch (e) {
      console.warn('Failed to navigate to character position:', e);
      setIsNavigating(false);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, scrollToCharacterDOMFallback]);

  // FIXED: Highlight text range with improved logic
  const highlightTextRange = useCallback((start: number, end: number, rangeId: string) => {
    if (!editor || !isEditorReady || isTransitioning || isNavigating) return;

    console.log('🧭 EditableSegmentedDisplay: Highlighting text range:', start, 'to', end, 'rangeId:', rangeId);

    try {
      setIsNavigating(true);
      setLastNavigatedRange(rangeId);
      
      const fromPos = convertCharPositionToTipTap(editor, start);
      const toPos = convertCharPositionToTipTap(editor, end);
      
      console.log('🧭 EditableSegmentedDisplay: Converted highlight positions - from:', fromPos, 'to:', toPos);
      
      // Try TipTap highlighting and scrolling
      if (!editor.isDestroyed) {
        try {
          editor.chain()
            .setTextSelection({ from: fromPos, to: toPos })
            .focus()
            .scrollIntoView()
            .run();
          
          // Use DOM fallback as secondary scroll
          setTimeout(() => {
            scrollToCharacterDOMFallback(start);
          }, 100);
          
          console.log('🧭 EditableSegmentedDisplay: TipTap highlight successful');
        } catch (e) {
          console.warn('TipTap highlighting failed:', e);
          scrollToCharacterDOMFallback(start);
        }
      }

      // Reset navigation flag
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        console.log('🧭 EditableSegmentedDisplay: Highlight navigation completed');
      }, 800);
      
    } catch (e) {
      console.warn('Failed to highlight text range:', e);
      setIsNavigating(false);
    }
  }, [editor, isEditorReady, isTransitioning, convertCharPositionToTipTap, scrollToCharacterDOMFallback]);

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

  // FIXED: Handle highlighted range navigation with proper comparison
  useEffect(() => {
    if (!highlightedRange || isNavigating || isTransitioning) return;
    
    const rangeId = `${highlightedRange.start}-${highlightedRange.end}`;
    
    // Only navigate if this is actually a different range
    if (lastNavigatedRange !== rangeId) {
      console.log('🧭 EditableSegmentedDisplay: New highlighted range detected:', rangeId);
      highlightTextRange(highlightedRange.start, highlightedRange.end, rangeId);
    }
  }, [highlightedRange?.start, highlightedRange?.end]); // Only depend on the actual range values

  // FIXED: Handle scroll position navigation with proper comparison
  useEffect(() => {
    if (scrollPosition === undefined || isNavigating || isTransitioning) return;
    
    const positionId = `scroll-${scrollPosition}`;
    
    // Only navigate if this is actually a different position
    if (lastNavigatedRange !== positionId) {
      console.log('🧭 EditableSegmentedDisplay: New scroll position detected:', scrollPosition);
      navigateToCharacterPosition(scrollPosition, positionId);
    }
  }, [scrollPosition]); // Only depend on the actual scroll position value

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
