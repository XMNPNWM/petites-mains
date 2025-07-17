
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

  // Debug content changes
  React.useEffect(() => {
    console.log('EditableSegmentedDisplay - Content prop changed:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + (content?.length > 100 ? '...' : ''),
      hasEditor: !!editor
    });
  }, [content, editor]);

  // Simplified editor ready handler - no complex state management
  const handleEditorReady = useCallback((editorInstance: any) => {
    console.log('EditableSegmentedDisplay - Editor ready:', {
      hasEditor: !!editorInstance,
      contentLength: content?.length || 0,
      readOnly
    });
    
    if (!editorInstance || editorInstance.isDestroyed) return;
    
    setEditor(editorInstance);
    
    // Apply read-only state immediately if needed
    if (readOnly && !editorInstance.isDestroyed) {
      try {
        editorInstance.setEditable(!readOnly);
        console.log('EditableSegmentedDisplay - Editor set to read-only');
      } catch (e) {
        console.warn('Failed to set editor editable state on ready:', e);
      }
    }
    
    if (onEditorReady) {
      onEditorReady(editorInstance);
    }
  }, [readOnly, onEditorReady]);

  // Simple read-only state management
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      try {
        editor.setEditable(!readOnly);
        console.log('EditableSegmentedDisplay - Editor editable state updated to:', !readOnly);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly]);

  // Always render the editor container, even when loading
  // This prevents the "Loading editor..." state from persisting

  return (
    <ErrorBoundary>
      <EditorStylesProvider>
        <div className="flex-1 flex flex-col relative h-full">
          {!readOnly && editor && <RichTextBubbleMenu editor={editor} />}
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
          
          {/* Show loading overlay only when editor is not ready */}
          {!editor && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-slate-500">Loading editor...</div>
            </div>
          )}
        </div>
      </EditorStylesProvider>
    </ErrorBoundary>
  );
};

export default EditableSegmentedDisplay;
