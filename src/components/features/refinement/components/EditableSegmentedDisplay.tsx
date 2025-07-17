
import React, { useState, useRef, useCallback } from 'react';
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
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  linesPerPage?: number;
  readOnly?: boolean;
}

const EditableSegmentedDisplay = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing...",
  onEditorReady,
  linesPerPage = 25,
  readOnly = false
}: EditableSegmentedDisplayProps) => {
  const [editor, setEditor] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousReadOnlyRef = useRef(readOnly);

  // Debug content changes
  React.useEffect(() => {
    console.log('EditableSegmentedDisplay - Content prop changed:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + (content?.length > 100 ? '...' : ''),
      hasEditor: !!editor
    });
  }, [content, editor]);

  // Enhanced editor ready handler with transition management
  const handleEditorReady = useCallback((editorInstance: any) => {
    console.log('EditableSegmentedDisplay - Editor ready:', {
      hasEditor: !!editorInstance,
      contentLength: content?.length || 0,
      content: content?.substring(0, 100) + (content?.length > 100 ? '...' : ''),
      readOnly
    });
    
    if (!editorInstance || editorInstance.isDestroyed) return;
    
    setEditor(editorInstance);
    
    // Clear transition state immediately when editor is ready - this fixes the loading overlay
    setIsTransitioning(false);
    
    // Apply read-only state after clearing transition
    if (readOnly && !editorInstance.isDestroyed) {
      setTimeout(() => {
        try {
          editorInstance.setEditable(!readOnly);
          console.log('EditableSegmentedDisplay - Editor set to read-only');
        } catch (e) {
          console.warn('Failed to set editor editable state on ready:', e);
        }
      }, 50);
    }
    
    if (onEditorReady) {
      onEditorReady(editorInstance);
    }
  }, [readOnly, onEditorReady, content]);

  // Enhanced read-only state management with transition buffering
  React.useEffect(() => {
    // If readOnly state is changing, add a transition buffer
    if (previousReadOnlyRef.current !== readOnly) {
      setIsTransitioning(true);
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Buffer the transition to prevent rapid state changes
      transitionTimeoutRef.current = setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          try {
            editor.setEditable(!readOnly);
            console.log('EditableSegmentedDisplay - Editor editable state updated to:', !readOnly);
          } catch (e) {
            console.warn('Failed to update editor editable state:', e);
          }
        }
        setIsTransitioning(false);
        previousReadOnlyRef.current = readOnly;
      }, 150); // 150ms buffer to prevent rapid transitions
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [editor, readOnly]);

  // Always render the editor container, even when loading
  // This prevents the "Loading editor..." state from persisting

  return (
    <ErrorBoundary>
      <EditorStylesProvider>
        <div className="flex-1 flex flex-col relative h-full">
          {!readOnly && editor && !isTransitioning && <RichTextBubbleMenu editor={editor} />}
          <ScrollSyncHandler onScrollSync={onScrollSync} scrollPosition={scrollPosition}>
            <ContentProcessor content={content || ""} linesPerPage={linesPerPage}>
              {(processedContent) => (
                <ErrorBoundary>
                  <EditorCore
                    content={processedContent}
                    onContentChange={onContentChange}
                    onEditorReady={handleEditorReady}
                    placeholder={placeholder}
                    readOnly={readOnly}
                  />
                </ErrorBoundary>
              )}
            </ContentProcessor>
          </ScrollSyncHandler>
          
          {/* Show loading overlay when editor is not ready or transitioning */}
          {(!editor || isTransitioning) && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-slate-500">
                {isTransitioning ? "Updating editor..." : "Loading editor..."}
              </div>
            </div>
          )}
        </div>
      </EditorStylesProvider>
    </ErrorBoundary>
  );
};

export default EditableSegmentedDisplay;
