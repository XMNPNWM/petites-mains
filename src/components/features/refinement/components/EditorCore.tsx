
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
  chapterKey?: string; // Force remount when chapter changes
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing...",
  readOnly = false,
  chapterKey
}: EditorCoreProps) => {
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyingRef = useRef(false);
  const lastContentRef = useRef<string>('');

  // Debounced content change handler 
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
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp) {
        // Remove page break nodes when saving content
        const htmlContent = editor.getHTML();
        const cleanContent = htmlContent.replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
        debouncedContentChange(cleanContent);
      }
    },
    onCreate: ({ editor }) => {
      console.log('EditorCore: Editor created for chapter:', chapterKey || 'none');
      // Set initial content explicitly
      const initialContent = content || '';
      if (initialContent && !editor.isDestroyed) {
        try {
          editor.commands.setContent(initialContent, false);
          lastContentRef.current = initialContent;
          console.log('EditorCore: Initial content set, length:', initialContent.length);
        } catch (e) {
          console.warn('EditorCore: Failed to set initial content:', e);
        }
      }
      
      // Notify parent when editor is ready
      if (onEditorReady && !isDestroyingRef.current) {
        onEditorReady(editor);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
    },
  }, [chapterKey]); // Recreate editor when chapter changes

  // Force content update when content prop changes
  useEffect(() => {
    if (!editor || editor.isDestroyed || isDestroyingRef.current) return;
    
    const incomingContent = content || '';
    
    // Skip if content hasn't actually changed
    if (lastContentRef.current === incomingContent) {
      console.log('EditorCore: Content unchanged, skipping update');
      return;
    }
    
    console.log('EditorCore: Forcing content update for chapter:', chapterKey || 'none', {
      incomingLength: incomingContent.length,
      lastLength: lastContentRef.current.length,
      preview: incomingContent.substring(0, 200) + (incomingContent.length > 200 ? '...' : '')
    });
    
    setIsUpdatingFromProp(true);
    
    try {
      // Force set content regardless of current state
      editor.commands.setContent(incomingContent, false);
      lastContentRef.current = incomingContent;
      console.log('EditorCore: Content force-updated successfully');
      
      // Reset updating flag after a short delay
      setTimeout(() => {
        if (!isDestroyingRef.current) {
          setIsUpdatingFromProp(false);
        }
      }, 100);
    } catch (error) {
      console.error('EditorCore: Failed to update content:', error);
      setIsUpdatingFromProp(false);
    }
  }, [content, editor, chapterKey]);

  // Update read-only state
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isDestroyingRef.current) {
      try {
        editor.setEditable(!readOnly);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly]);

  // Cleanup on unmount
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
