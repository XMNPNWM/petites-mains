
import React, { useState, useCallback, useEffect, useRef } from 'react';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import EditorCore from './EditorCore';
import ScrollSyncHandler from './ScrollSyncHandler';
import ContentProcessor from './ContentProcessor';
import EditorStylesProvider from './EditorStylesProvider';
import ErrorBoundary from './ErrorBoundary';
import { useNavigationState } from '@/hooks/useNavigationState';
import { DOMNavigationUtils } from '@/utils/DOMNavigationUtils';

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
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    navigationState,
    startNavigation,
    endNavigation,
    cleanup
  } = useNavigationState();

  // Improved character position navigation with proper DOM handling
  const navigateToCharacterPosition = useCallback((charPosition: number, type: 'auto' | 'manual' | 'click') => {
    const container = editorContainerRef.current;
    if (!container || !isEditorReady || isTransitioning) {
      console.log('🧭 Navigation skipped - container not ready:', {
        hasContainer: !!container,
        isEditorReady,
        isTransitioning
      });
      return;
    }

    // Validate character position
    const textContent = container.textContent || '';
    if (!DOMNavigationUtils.validateCharacterPosition(textContent, charPosition)) {
      console.warn('🧭 Invalid character position:', charPosition, 'text length:', textContent.length);
      return;
    }

    // Start navigation with lock
    if (!startNavigation(type)) {
      return; // Navigation already in progress
    }

    console.log('🧭 EditableSegmentedDisplay: Navigating to character:', charPosition, 'type:', type);

    try {
      // Find the ProseMirror editor element
      const proseMirrorElement = container.querySelector('.ProseMirror') as HTMLElement;
      if (!proseMirrorElement) {
        console.warn('ProseMirror element not found');
        endNavigation();
        return;
      }

      // Use precise DOM navigation
      const success = DOMNavigationUtils.scrollToCharacterPosition(
        proseMirrorElement,
        charPosition,
        'smooth'
      );

      if (!success) {
        console.warn('🧭 DOM navigation failed');
        endNavigation();
        return;
      }

      // Only set TipTap cursor for manual/click navigation, not auto-navigation
      if (type !== 'auto' && editor && !editor.isDestroyed) {
        try {
          const doc = editor.state.doc;
          const maxPos = doc.content.size;
          const safePos = Math.min(charPosition + 1, maxPos);
          
          // Set cursor without focusing to avoid disrupting user
          editor.chain()
            .setTextSelection(safePos)
            .run();
            
          console.log('🧭 TipTap cursor set for manual navigation:', safePos);
        } catch (e) {
          console.warn('TipTap cursor setting failed:', e);
        }
      }

      console.log('🧭 Navigation completed successfully');

    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      endNavigation();
    }
  }, [editor, isEditorReady, isTransitioning, startNavigation, endNavigation]);

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
      cleanup(); // Clear navigation state
    }
  }, [isTransitioning, cleanup]);

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

  // Handle highlighted range navigation (from change clicks)
  useEffect(() => {
    if (!highlightedRange || navigationState.isNavigating || isTransitioning || !isEditorReady) {
      return;
    }
    
    console.log('🧭 EditableSegmentedDisplay: Highlighted range change detected:', highlightedRange);
    navigateToCharacterPosition(highlightedRange.start, 'click');
  }, [highlightedRange?.start, navigationState.isNavigating, isTransitioning, isEditorReady, navigateToCharacterPosition]);

  // Handle scroll position navigation (separate from highlighted range)
  useEffect(() => {
    if (
      scrollPosition === undefined || 
      scrollPosition === 0 || 
      navigationState.isNavigating || 
      isTransitioning || 
      !isEditorReady ||
      highlightedRange // Don't auto-scroll if we have a highlighted range
    ) {
      return;
    }
    
    console.log('🧭 EditableSegmentedDisplay: Scroll position change detected:', scrollPosition);
    navigateToCharacterPosition(scrollPosition, 'auto');
  }, [scrollPosition, navigationState.isNavigating, isTransitioning, isEditorReady, highlightedRange, navigateToCharacterPosition]);

  // Cleanup navigation on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
