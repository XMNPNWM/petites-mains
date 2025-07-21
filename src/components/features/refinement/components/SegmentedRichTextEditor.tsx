
import React, { useRef, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import { SearchReplaceExtension } from '../extensions/SearchReplaceExtension';
import { useTextSegmentation } from '@/hooks/useTextSegmentation';

interface SegmentedRichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  wordsPerPage?: number;
}

const SegmentedRichTextEditor = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing...",
  onEditorReady,
  wordsPerPage = 300
}: SegmentedRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);

  // Get text segments for visual display
  const segments = useTextSegmentation(content, wordsPerPage);


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      SearchReplaceExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp) {
        onContentChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        // Prevent losing focus on common shortcuts
        if (event.ctrlKey || event.metaKey) {
          return false;
        }
        return false;
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
      
      // Don't sync if this panel is the source
      if (sourcePanel === 'enhanced') return;

      const { scrollHeight, clientHeight } = editorElement;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      editorElement.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, []);

  // Sync scroll position when it changes externally
  useEffect(() => {
    if (scrollPosition !== undefined && editorRef.current) {
      const editorElement = editorRef.current.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.scrollTop = scrollPosition;
      }
    }
  }, [scrollPosition]);

  // Update editor content when content prop changes - FIX FOR CURSOR BUG
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        setIsUpdatingFromProp(true);
        // Store current selection
        const { from, to } = editor.state.selection;
        editor.commands.setContent(content, false);
        // Restore selection if possible
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          // Selection restoration failed, cursor will be at end
        }
        setIsUpdatingFromProp(false);
      }
    }
  }, [content, editor]);

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

  // Render segmented view or regular editor based on content length
  const shouldShowSegmented = segments.length > 1;

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <RichTextBubbleMenu editor={editor} />
      <div ref={editorRef} className="flex-1 overflow-hidden">
        {shouldShowSegmented ? (
          <div className="h-full overflow-y-auto prose-sm max-w-none">
            <div className="space-y-8 p-4">
              {segments.map((segment, index) => (
                <div key={index} className="min-h-[400px] border-b border-slate-100 pb-6 last:border-b-0">
                  <div className="text-xs text-slate-400 mb-2 text-right">Page {segment.pageNumber}</div>
                  <div 
                    className="whitespace-pre-wrap leading-relaxed break-words text-sm"
                    dangerouslySetInnerHTML={{ __html: segment.content }}
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <EditorContent 
                editor={editor} 
                className="h-full overflow-y-auto prose-sm max-w-none opacity-0"
              />
            </div>
          </div>
        ) : (
          <EditorContent 
            editor={editor} 
            className="h-full overflow-y-auto prose-sm max-w-none text-sm"
          />
        )}
      </div>
    </div>
  );
};

export default SegmentedRichTextEditor;
