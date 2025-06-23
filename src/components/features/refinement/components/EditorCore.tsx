
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SearchReplaceExtension } from '../extensions/SearchReplaceExtension';
import { PageBreakExtension } from '../extensions/PageBreakExtension';

interface EditorCoreProps {
  content: string;
  onContentChange: (content: string) => void;
  onEditorReady?: (editor: any) => void;
  placeholder?: string;
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing..."
}: EditorCoreProps) => {
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);

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
    content,
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

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML().replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
      if (currentContent !== content) {
        setIsUpdatingFromProp(true);
        const { from, to } = editor.state.selection;
        editor.commands.setContent(content, false);
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          // Selection restoration failed
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

  return (
    <EditorContent 
      editor={editor} 
      className="h-full overflow-y-auto prose-sm max-w-none text-sm"
    />
  );
};

export default EditorCore;
