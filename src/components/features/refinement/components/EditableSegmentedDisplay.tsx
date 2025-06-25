
import React, { useState } from 'react';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import EditorCore from './EditorCore';
import ScrollSyncHandler from './ScrollSyncHandler';
import ContentProcessor from './ContentProcessor';
import EditorStylesProvider from './EditorStylesProvider';

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

  const handleEditorReady = (editorInstance: any) => {
    setEditor(editorInstance);
    
    // Apply read-only state if needed
    if (readOnly && editorInstance && !editorInstance.isDestroyed) {
      editorInstance.setEditable(!readOnly);
    }
    
    if (onEditorReady) {
      onEditorReady(editorInstance);
    }
  };

  // Update editor read-only state when prop changes
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-slate-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <EditorStylesProvider>
      <div className="flex-1 flex flex-col relative h-full">
        {!readOnly && <RichTextBubbleMenu editor={editor} />}
        <ScrollSyncHandler onScrollSync={onScrollSync} scrollPosition={scrollPosition}>
          <ContentProcessor content={content} linesPerPage={linesPerPage}>
            {(processedContent) => (
              <EditorCore
                content={processedContent}
                onContentChange={onContentChange}
                onEditorReady={handleEditorReady}
                placeholder={placeholder}
              />
            )}
          </ContentProcessor>
        </ScrollSyncHandler>
      </div>
    </EditorStylesProvider>
  );
};

export default EditableSegmentedDisplay;
