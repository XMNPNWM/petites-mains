
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
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Convert character position to TipTap position
  const findTipTapPositionFromCharacterIndex = (editor: any, characterIndex: number): number => {
    if (!editor || editor.isDestroyed) return 0;
    
    try {
      const doc = editor.state.doc;
      const content = doc.textContent;
      
      if (characterIndex >= content.length) {
        return doc.content.size;
      }
      
      let currentPos = 0;
      let tipTapPos = 1; // TipTap positions start from 1
      
      // Walk through the document to find the position
      doc.descendants((node: any, pos: number) => {
        if (node.isText) {
          const nodeLength = node.text.length;
          if (currentPos + nodeLength >= characterIndex) {
            tipTapPos = pos + (characterIndex - currentPos) + 1;
            return false; // Stop iteration
          }
          currentPos += nodeLength;
        }
        return true;
      });
      
      return Math.min(tipTapPos, doc.content.size);
    } catch (error) {
      console.warn('Error converting character position to TipTap position:', error);
      return 0;
    }
  };

  // Scroll to character position in the editor
  const scrollToCharacterPosition = useCallback((characterPosition: number) => {
    if (!editor || editor.isDestroyed || !isEditorReady) {
      console.warn('Editor not ready for navigation');
      return;
    }

    try {
      const tipTapPosition = findTipTapPositionFromCharacterIndex(editor, characterPosition);
      
      console.log('🧭 Navigating in enhanced panel:', {
        characterPosition,
        tipTapPosition,
        editorReady: isEditorReady
      });

      // Set selection at the position to highlight it
      editor.chain()
        .focus()
        .setTextSelection(tipTapPosition)
        .run();

      // Scroll the selection into view
      const editorView = editor.view;
      if (editorView) {
        // Get the DOM position
        const resolvedPos = editorView.state.doc.resolve(tipTapPosition);
        const coords = editorView.coordsAtPos(resolvedPos.pos);
        
        // Scroll into view with smooth animation
        editorView.dom.scrollTo({
          top: Math.max(0, coords.top - editorView.dom.getBoundingClientRect().top - 100),
          behavior: 'smooth'
        });
      }
      
    } catch (error) {
      console.error('Error scrolling to character position in editor:', error);
    }
  }, [editor, isEditorReady]);

  // Handle highlighting in the editor
  const highlightTextRange = useCallback((start: number, end: number) => {
    if (!editor || editor.isDestroyed || !isEditorReady) return;

    try {
      const startPos = findTipTapPositionFromCharacterIndex(editor, start);
      const endPos = findTipTapPositionFromCharacterIndex(editor, end);
      
      console.log('🎯 Highlighting text in enhanced panel:', {
        characterRange: { start, end },
        tipTapRange: { start: startPos, end: endPos }
      });

      // Create selection to highlight the text
      editor.chain()
        .focus()
        .setTextSelection({ from: startPos, to: endPos })
        .run();

      // Scroll to the selection
      scrollToCharacterPosition(start);
      
    } catch (error) {
      console.error('Error highlighting text range in editor:', error);
    }
  }, [editor, isEditorReady, scrollToCharacterPosition]);

  // Reset editor ready state when transitioning
  useEffect(() => {
    if (isTransitioning) {
      setIsEditorReady(false);
      setEditor(null);
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

  // Handle navigation when highlightedRange changes
  useEffect(() => {
    if (!highlightedRange || !editor || !isEditorReady || isTransitioning) {
      return;
    }

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Delay navigation to ensure editor is fully rendered
    navigationTimeoutRef.current = setTimeout(() => {
      highlightTextRange(highlightedRange.start, highlightedRange.end);
    }, 100);

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [highlightedRange, editor, isEditorReady, isTransitioning, highlightTextRange]);

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
