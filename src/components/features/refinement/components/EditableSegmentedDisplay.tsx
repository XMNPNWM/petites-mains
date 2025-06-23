
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import { SearchReplaceExtension } from '../extensions/SearchReplaceExtension';
import { PageBreakExtension } from '../extensions/PageBreakExtension';
import { useLineBasedSegmentation } from '@/hooks/useLineBasedSegmentation';

interface EditableSegmentedDisplayProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  linesPerPage?: number;
}

const EditableSegmentedDisplay = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing...",
  onEditorReady,
  linesPerPage = 25
}: EditableSegmentedDisplayProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);

  // Convert content to include page breaks
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    const segments = useLineBasedSegmentation(content, linesPerPage);
    if (segments.length <= 1) return content;
    
    // Insert page breaks between segments
    return segments
      .map((segment, index) => {
        if (index === segments.length - 1) {
          return segment.content;
        }
        return segment.content + '<div data-type="page-break"></div>';
      })
      .join('');
  }, [content, linesPerPage]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      SearchReplaceExtension,
      PageBreakExtension,
    ],
    content: processedContent,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp) {
        // Remove page break nodes when saving content
        const htmlContent = editor.getHTML();
        const cleanContent = htmlContent.replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
        onContentChange(cleanContent);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
    },
  });

  // Handle scroll synchronization
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (!editorElement || !onScrollSync) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = editorElement;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    editorElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => editorElement.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

  // Listen for external scroll sync events
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (!editorElement) return;

    const handleExternalSync = (event: CustomEvent) => {
      const { sourcePanel, scrollRatio } = event.detail;
      
      if (sourcePanel === 'enhanced') return;

      const { scrollHeight, clientHeight } = editorElement;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      editorElement.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, []);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML().replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
      if (currentContent !== content) {
        setIsUpdatingFromProp(true);
        const { from, to } = editor.state.selection;
        editor.commands.setContent(processedContent, false);
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          // Selection restoration failed
        }
        setIsUpdatingFromProp(false);
      }
    }
  }, [content, editor, processedContent]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-slate-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <RichTextBubbleMenu editor={editor} />
      <div ref={editorRef} className="flex-1 overflow-hidden">
        <EditorContent 
          editor={editor} 
          className="h-full overflow-y-auto prose-sm max-w-none text-sm"
        />
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .page-break-node {
            margin: 2rem 0;
            padding: 1rem 0;
            border-top: 2px dashed #cbd5e1;
            border-bottom: 2px dashed #cbd5e1;
            background: linear-gradient(90deg, transparent 0%, #f1f5f9 50%, transparent 100%);
            text-align: center;
            user-select: none;
            position: relative;
          }
          
          .page-break-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          
          .page-break-line {
            flex: 1;
            height: 1px;
            background: #cbd5e1;
          }
          
          .page-break-text {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 500;
            background: white;
            padding: 0.25rem 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 9999px;
          }
          
          .page-break-node:hover {
            background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
          }
          
          .page-break-node:hover .page-break-text {
            background: #f8fafc;
          }
        `
      }} />
    </div>
  );
};

export default EditableSegmentedDisplay;
