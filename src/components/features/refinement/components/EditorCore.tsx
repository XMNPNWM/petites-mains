
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
  chapterKey?: string;
  isTransitioning?: boolean; // New prop to handle transitions
  preserveContent?: boolean; // New prop to help preserve content
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing...",
  readOnly = false,
  chapterKey,
  isTransitioning = false,
  preserveContent = false
}: EditorCoreProps) => {
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [preservedContent, setPreservedContent] = useState<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyingRef = useRef(false);
  const lastContentRef = useRef<string>('');
  const editorInstanceRef = useRef<any>(null);

  // CRITICAL FIX: Preserve content during transitions
  useEffect(() => {
    if (content && !isTransitioning) {
      setPreservedContent(content);
    }
  }, [content, isTransitioning]);

  // CRITICAL FIX: Use effective content during transitions
  const effectiveContent = content || (preserveContent && isTransitioning ? preservedContent : '');

  // Debounced content change handler with transition awareness
  const debouncedContentChange = useCallback((content: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Skip content changes during transitions to prevent conflicts
    if (isTransitioning) {
      console.log('⏸️ Skipping content change during transition');
      return;
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!isDestroyingRef.current && !isTransitioning) {
        onContentChange(content);
      }
    }, 100);
  }, [onContentChange, isTransitioning]);

  // Safe editor creation with enhanced error handling
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
    content: effectiveContent || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp && editorReady) {
        try {
          const htmlContent = editor.getHTML();
          const cleanContent = htmlContent.replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
          debouncedContentChange(cleanContent);
        } catch (error) {
          console.warn('EditorCore: Failed to process content update:', error);
        }
      }
    },
    onCreate: ({ editor }) => {
      console.log('EditorCore: Editor created for chapter:', chapterKey || 'none');
      editorInstanceRef.current = editor;
      
      // Set initial content with error handling
      const initialContent = effectiveContent || '';
      if (initialContent && !editor.isDestroyed) {
        try {
          editor.commands.setContent(initialContent, false);
          lastContentRef.current = initialContent;
          console.log('EditorCore: Initial content set, length:', initialContent.length);
        } catch (e) {
          console.warn('EditorCore: Failed to set initial content:', e);
        }
      }
      
      // Mark editor as ready after a short delay to ensure stability
      setTimeout(() => {
        if (!isDestroyingRef.current && !editor.isDestroyed) {
          setEditorReady(true);
          if (onEditorReady) {
            onEditorReady(editor);
          }
        }
      }, 50);
    },
    onDestroy: () => {
      console.log('EditorCore: Editor destroyed for chapter:', chapterKey || 'none');
      setEditorReady(false);
      editorInstanceRef.current = null;
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
    },
  }, [chapterKey]); // Recreate editor when chapter changes

  // CRITICAL FIX: Enhanced content synchronization with better preservation
  useEffect(() => {
    if (!editor || editor.isDestroyed || isDestroyingRef.current) return;
    
    const incomingContent = effectiveContent || '';
    
    // CRITICAL FIX: Skip updates during transitions unless content is significantly different
    if (isTransitioning && preserveContent) {
      const currentEditorContent = editor.getHTML();
      if (currentEditorContent && currentEditorContent.length > 0) {
        console.log('⏸️ Preserving editor content during transition');
        return;
      }
    }
    
    // Skip unnecessary updates if content hasn't actually changed
    if (lastContentRef.current === incomingContent) {
      return;
    }
    
    console.log('EditorCore: Content prop changed for chapter:', chapterKey || 'none', {
      incomingLength: incomingContent.length,
      currentEditorLength: editor.getHTML().length,
      isTransitioning,
      preserveContent
    });
    
    setIsUpdatingFromProp(true);
    
    try {
      editor.commands.setContent(incomingContent, false);
      lastContentRef.current = incomingContent;
      console.log('EditorCore: Content updated successfully');
      
      setTimeout(() => {
        if (!isDestroyingRef.current) {
          setIsUpdatingFromProp(false);
        }
      }, 100);
    } catch (error) {
      console.error('EditorCore: Failed to update content:', error);
      setIsUpdatingFromProp(false);
    }
  }, [effectiveContent, editor, chapterKey, isTransitioning, preserveContent]);

  // Update read-only state safely
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isDestroyingRef.current && editorReady) {
      try {
        editor.setEditable(!readOnly);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly, editorReady]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyingRef.current = true;
      
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Safe editor destruction with timeout
      if (editor && !editor.isDestroyed) {
        try {
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              editor.destroy();
            }
          }, 0);
        } catch (e) {
          console.warn('Editor cleanup failed:', e);
        }
      }
    };
  }, [editor]);

  // Show loading state during transitions or while editor is initializing
  if (isTransitioning || !editorReady) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isTransitioning ? 'Switching chapters...' : 'Loading editor...'}
        </div>
      </div>
    );
  }

  return (
    <EditorContent 
      editor={editor} 
      className="h-full overflow-y-auto prose-sm max-w-none text-sm"
    />
  );
};

export default EditorCore;
