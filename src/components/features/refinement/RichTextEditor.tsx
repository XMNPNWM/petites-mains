
import React, { useRef, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import RichTextBubbleMenu from './components/RichTextBubbleMenu';
import { SearchReplaceExtension } from './extensions/SearchReplaceExtension';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

const RichTextEditor = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing...",
  onEditorReady
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

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
      if (!editor.isDestroyed) {
        onContentChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
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

    const handleScroll = (e: Event) => {
      const element = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = element;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    editorElement.addEventListener('scroll', handleScroll);
    return () => editorElement.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

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
          className="h-full overflow-y-auto prose prose-sm max-w-none"
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
