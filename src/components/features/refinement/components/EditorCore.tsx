
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
    content,
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
      // Notify parent immediately when editor is created
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
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isDestroyingRef.current) {
      const currentContent = editor.getHTML().replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
      const incomingContent = content || '';
      
      // Debug logging with chapter key
      console.log('EditorCore content update:', {
        chapterKey: chapterKey || 'none',
        incomingContentLength: incomingContent.length,
        currentContentLength: currentContent.length,
        contentChanged: currentContent !== incomingContent,
        incomingPreview: incomingContent.substring(0, 100) + '...',
        currentPreview: currentContent.substring(0, 100) + '...'
      });
      
      // Always update if content is different, including empty content
      if (currentContent !== incomingContent) {
        setIsUpdatingFromProp(true);
        
        try {
          // Store current selection if any
          let selection = null;
          try {
            selection = editor.state.selection;
          } catch (e) {
            // Selection might not be available, that's ok
          }
          
          // Set new content
          editor.commands.setContent(incomingContent, false);
          console.log('EditorCore: Content updated successfully');
          
          // Restore selection if we had one and content is not empty
          setTimeout(() => {
            if (!editor.isDestroyed && !isDestroyingRef.current) {
              if (selection && incomingContent.length > 0) {
                try {
                  const { from, to } = selection;
                  const docSize = editor.state.doc.content.size;
                  const safeFrom = Math.min(from, docSize);
                  const safeTo = Math.min(to, docSize);
                  editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
                } catch (e) {
                  // Selection restoration failed, ignore silently
                }
              }
              setIsUpdatingFromProp(false);
            }
          }, 50);
        } catch (e) {
          console.warn('Editor content update failed:', e);
          setIsUpdatingFromProp(false);
        }
      } else {
        console.log('EditorCore: Content unchanged, skipping update');
      }
    }
  }, [content, editor]);

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
