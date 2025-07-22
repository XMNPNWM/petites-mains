
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
  isTransitioning?: boolean;
  highlightedRange?: { start: number; end: number } | null;
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing...",
  readOnly = false,
  chapterKey,
  isTransitioning = false,
  highlightedRange
}: EditorCoreProps) => {
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyingRef = useRef(false);
  const lastContentRef = useRef<string>('');
  const editorInstanceRef = useRef<any>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cursor position preservation
  const cursorPositionRef = useRef<{ from: number; to: number } | null>(null);

  // Reduced debounce for better responsiveness and cursor preservation
  const debouncedContentChange = useCallback((content: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!isDestroyingRef.current && !isTransitioning) {
        onContentChange(content);
      }
    }, 50); // Reduced from 100ms to 50ms
  }, [onContentChange, isTransitioning]);

  // Stable editor options for export use case
  const editorDependencies = chapterKey === 'export-preview' ? [] : [chapterKey];

  // Safe editor creation
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
      if (!editor.isDestroyed && !isUpdatingFromProp && editorReady) {
        try {
          // Store cursor position before content change
          const selection = editor.state.selection;
          cursorPositionRef.current = { from: selection.from, to: selection.to };
          
          const htmlContent = editor.getHTML();
          const cleanContent = htmlContent.replace(/<div[^>]*data-type="page-break"[^>]*>.*?<\/div>/g, '');
          debouncedContentChange(cleanContent);
        } catch (error) {
          console.warn('EditorCore: Failed to process content update:', error);
        }
      }
    },
    onCreate: ({ editor }) => {
      console.log('EditorCore: Editor created for:', chapterKey || 'unknown');
      editorInstanceRef.current = editor;
      isDestroyingRef.current = false;
      
      // Set initial content with error handling
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
      
      // Clear any existing timeout
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      
      // Mark editor as ready with extended timeout for stability
      readyTimeoutRef.current = setTimeout(() => {
        if (!isDestroyingRef.current && !editor.isDestroyed) {
          console.log('EditorCore: Setting editor ready to true');
          setEditorReady(true);
          if (onEditorReady) {
            onEditorReady(editor);
          }
        }
      }, 100);
    },
    onDestroy: () => {
      console.log('EditorCore: Editor destroyed for:', chapterKey || 'unknown');
      isDestroyingRef.current = true;
      setEditorReady(false);
      editorInstanceRef.current = null;
      
      // Clear timeouts
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed overflow-y-auto',
        spellcheck: 'true',
      },
    },
  }, editorDependencies);

  // Content synchronization with better stability
  useEffect(() => {
    if (!editor || editor.isDestroyed || isDestroyingRef.current || !editorReady) return;
    
    const incomingContent = content || '';
    
    // Skip unnecessary updates if content hasn't actually changed
    if (lastContentRef.current === incomingContent) {
      return;
    }
    
    console.log('EditorCore: Updating content for:', chapterKey || 'unknown', {
      incomingLength: incomingContent.length,
      currentEditorLength: editor.getHTML().length,
      isTransitioning,
      editorReady
    });
    
    setIsUpdatingFromProp(true);
    
    try {
      // Store current cursor position before content update
      const currentSelection = editor.state.selection;
      const preservedCursor = { from: currentSelection.from, to: currentSelection.to };
      
      // Use transaction to preserve cursor position
      editor.chain()
        .setContent(incomingContent, false)
        .focus()
        .setTextSelection(preservedCursor.from)
        .run();
      
      lastContentRef.current = incomingContent;
      console.log('EditorCore: Content updated successfully with cursor preservation');
      
      setTimeout(() => {
        if (!isDestroyingRef.current) {
          setIsUpdatingFromProp(false);
          
          // Restore cursor position if it was stored during typing
          if (cursorPositionRef.current && editor && !editor.isDestroyed) {
            try {
              const maxPos = editor.state.doc.content.size;
              const safeFrom = Math.min(cursorPositionRef.current.from, maxPos);
              const safeTo = Math.min(cursorPositionRef.current.to, maxPos);
              
              editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
              cursorPositionRef.current = null; // Clear after use
            } catch (e) {
              console.warn('Failed to restore cursor position:', e);
            }
          }
        }
      }, 50); // Reduced timeout for better responsiveness
    } catch (error) {
      console.error('EditorCore: Failed to update content:', error);
      setIsUpdatingFromProp(false);
    }
  }, [content, editor, chapterKey, isTransitioning, editorReady]);

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
      console.log('EditorCore: Component unmounting for:', chapterKey || 'unknown');
      isDestroyingRef.current = true;
      
      // Clear all timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      
      // Safe editor destruction
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
  }, [editor, chapterKey]);

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
