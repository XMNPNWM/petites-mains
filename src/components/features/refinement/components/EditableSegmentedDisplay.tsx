
import React, { useRef, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import RichTextBubbleMenu from './RichTextBubbleMenu';
import { SearchReplaceExtension } from '../extensions/SearchReplaceExtension';

interface EditableSegmentedDisplayProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
  readOnly?: boolean;
  chapterKey?: string;
  isLoading?: boolean;
  isTransitioning?: boolean;
  highlightedRange?: { start: number; end: number } | null;
}

const EditableSegmentedDisplay = ({
  content,
  onContentChange,
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing...",
  onEditorReady,
  readOnly = false,
  chapterKey,
  isLoading = false,
  isTransitioning = false,
  highlightedRange
}: EditableSegmentedDisplayProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

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
    editable: !readOnly && !isLoading && !isTransitioning,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !readOnly) {
        onContentChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        if (event.ctrlKey || event.metaKey) {
          return false;
        }
        return false;
      },
    },
  }, [chapterKey]); // Re-create editor when chapter changes

  // Handle scroll synchronization
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (!editorElement || !onScrollSync) return;

    const handleScroll = (e: Event) => {
      const element = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = element;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    editorElement.addEventListener('scroll', handleScroll);
    return () => editorElement.removeEventListener('scroll', handleScroll);
  }, [onScrollSync, editor]);

  // Sync scroll position when it changes externally
  useEffect(() => {
    if (scrollPosition !== undefined && editorRef.current) {
      const editorElement = editorRef.current.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.scrollTop = scrollPosition;
      }
    }
  }, [scrollPosition]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle highlighting
  useEffect(() => {
    if (!highlightedRange || !editor || !editorRef.current) {
      return;
    }

    console.log('🎨 Applying highlight to range:', highlightedRange);

    // Simple approach: just add CSS highlighting without DOM manipulation
    const editorElement = editorRef.current.querySelector('.ProseMirror');
    if (editorElement) {
      // Add a data attribute to trigger CSS highlighting
      editorElement.setAttribute('data-highlight-start', highlightedRange.start.toString());
      editorElement.setAttribute('data-highlight-end', highlightedRange.end.toString());
      editorElement.classList.add('has-highlight');

      // Clear highlight after 5 seconds
      const timer = setTimeout(() => {
        if (editorElement) {
          editorElement.removeAttribute('data-highlight-start');
          editorElement.removeAttribute('data-highlight-end');
          editorElement.classList.remove('has-highlight');
        }
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [highlightedRange, editor]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update editor editable state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!readOnly && !isLoading && !isTransitioning);
    }
  }, [editor, readOnly, isLoading, isTransitioning]);

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
      {!readOnly && <RichTextBubbleMenu editor={editor} />}
      <div ref={editorRef} className="flex-1 overflow-hidden">
        <style>
          {`
            .has-highlight {
              background: rgba(251, 191, 36, 0.1);
              animation: highlight-pulse 2s ease-in-out;
            }
            
            @keyframes highlight-pulse {
              0%, 100% { 
                background: rgba(251, 191, 36, 0.1);
              }
              50% { 
                background: rgba(251, 191, 36, 0.2);
              }
            }
          `}
        </style>
        <EditorContent 
          editor={editor} 
          className="h-full overflow-y-auto prose prose-sm max-w-none"
        />
      </div>
      
      {/* Loading overlay for transitions */}
      {(isLoading || isTransitioning) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="text-slate-500">
            {isLoading ? 'Processing...' : 'Loading...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableSegmentedDisplay;
