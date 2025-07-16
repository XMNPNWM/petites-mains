
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SearchReplaceExtension } from '../extensions/SearchReplaceExtension';
import { PageBreakExtension } from '../extensions/PageBreakExtension';

interface EditorCoreProps {
  content: string;
  onContentChange: (content: string) => void;
  onEditorReady?: (editor: any) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing...",
  readOnly = false
}: EditorCoreProps) => {
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  const [isEditorStable, setIsEditorStable] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyingRef = useRef(false);

  // Debounced content change handler to prevent rapid updates during state transitions
  const debouncedContentChange = useCallback((content: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!isDestroyingRef.current) {
        onContentChange(content);
      }
    }, 100);
  }, [onContentChange]);

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
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp && isEditorStable) {
        // Remove page break nodes when saving content
        const htmlContent = editor.getHTML();
        const cleanContent = htmlContent.replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
        debouncedContentChange(cleanContent);
      }
    },
    onCreate: ({ editor }) => {
      // Mark editor as stable after creation
      setTimeout(() => {
        if (!isDestroyingRef.current) {
          setIsEditorStable(true);
        }
      }, 100);
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
    },
  });

  // Update editor content when content prop changes with proper error handling
  useEffect(() => {
    if (editor && !editor.isDestroyed && isEditorStable && !isDestroyingRef.current) {
      const currentContent = editor.getHTML().replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
      if (currentContent !== content) {
        setIsUpdatingFromProp(true);
        
        try {
          const { from, to } = editor.state.selection;
          editor.commands.setContent(content, false);
          
          // Restore selection with error handling
          setTimeout(() => {
            if (!editor.isDestroyed && !isDestroyingRef.current) {
              try {
                editor.commands.setTextSelection({ from, to });
              } catch (e) {
                // Selection restoration failed, ignore silently
              }
              setIsUpdatingFromProp(false);
            }
          }, 50);
        } catch (e) {
          // Content update failed
          console.warn('Editor content update failed:', e);
          setIsUpdatingFromProp(false);
        }
      }
    }
  }, [content, editor, isEditorStable]);

  // Update read-only state with proper synchronization
  useEffect(() => {
    if (editor && !editor.isDestroyed && isEditorStable && !isDestroyingRef.current) {
      try {
        editor.setEditable(!readOnly);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly, isEditorStable]);

  // Notify parent when editor is ready and stable
  useEffect(() => {
    if (editor && isEditorStable && onEditorReady && !isDestroyingRef.current) {
      onEditorReady(editor);
    }
  }, [editor, isEditorStable, onEditorReady]);

  // Cleanup on unmount with proper error handling
  useEffect(() => {
    return () => {
      isDestroyingRef.current = true;
      
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Destroy editor safely
      if (editor && !editor.isDestroyed) {
        try {
          editor.destroy();
        } catch (e) {
          console.warn('Editor cleanup failed:', e);
        }
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
