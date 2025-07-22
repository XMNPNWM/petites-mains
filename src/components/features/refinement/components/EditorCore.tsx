
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
  isEnhancing?: boolean; // NEW: Enhancement lock
}

const EditorCore = ({ 
  content, 
  onContentChange, 
  onEditorReady,
  placeholder = "Start writing...",
  readOnly = false,
  chapterKey,
  isTransitioning = false,
  highlightedRange,
  isEnhancing = false // NEW: Enhancement lock
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

  // Content update debounce - prevent updates during enhancement
  const debouncedContentChange = useCallback((content: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!isDestroyingRef.current && !isTransitioning && !isEnhancing) {
        onContentChange(content);
      } else if (isEnhancing) {
        console.log('⏸️ EditorCore: Skipping content change - enhancement in progress');
      }
    }, 50);
  }, [onContentChange, isTransitioning, isEnhancing]);

  // Stable editor options for export use case
  const editorDependencies = chapterKey === 'export-preview' ? [] : [chapterKey];

  // Safe editor creation
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
      }),
      SearchReplaceExtension,
      PageBreakExtension,
    ],
    content: content || '',
    editable: !readOnly && !isEnhancing, // Disable editing during enhancement
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed && !isUpdatingFromProp && editorReady && !isEnhancing) {
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
      } else if (isEnhancing) {
        console.log('⏸️ EditorCore: Skipping update - enhancement in progress');
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

  // Content synchronization with better stability and enhancement protection
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
      editorReady,
      isEnhancing
    });
    
    setIsUpdatingFromProp(true);
    
    try {
      // CLEAR UNDO HISTORY when loading new enhanced content to prevent conflicts
      if (isEnhancing || incomingContent !== lastContentRef.current) {
        console.log('🧹 EditorCore: Clearing undo history for new content');
        editor.commands.clearContent();
        editor.commands.setContent(incomingContent, false);
        // Note: TipTap doesn't have clearHistory command
      } else {
        // Store current cursor position before content update
        const currentSelection = editor.state.selection;
        const preservedCursor = { from: currentSelection.from, to: currentSelection.to };
        
        // Use transaction to preserve cursor position
        editor.chain()
          .setContent(incomingContent, false)
          .focus()
          .setTextSelection(preservedCursor.from)
          .run();
      }
      
      lastContentRef.current = incomingContent;
      console.log('EditorCore: Content updated successfully');
      
      setTimeout(() => {
        if (!isDestroyingRef.current) {
          setIsUpdatingFromProp(false);
          
          // Restore cursor position if it was stored during typing (but not during enhancement)
          if (cursorPositionRef.current && editor && !editor.isDestroyed && !isEnhancing) {
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
      }, 50);
    } catch (error) {
      console.error('EditorCore: Failed to update content:', error);
      setIsUpdatingFromProp(false);
    }
  }, [content, editor, chapterKey, isTransitioning, editorReady, isEnhancing]);

  // Update read-only state safely - also consider enhancement state
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isDestroyingRef.current && editorReady) {
      try {
        const shouldBeEditable = !readOnly && !isEnhancing;
        editor.setEditable(shouldBeEditable);
        console.log('EditorCore: Editable state updated:', shouldBeEditable);
      } catch (e) {
        console.warn('Failed to update editor editable state:', e);
      }
    }
  }, [editor, readOnly, editorReady, isEnhancing]);

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

  // Show loading state during transitions, enhancement, or while editor is initializing
  if (isTransitioning || !editorReady || isEnhancing) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isEnhancing ? 'Processing enhancement...' : 
           isTransitioning ? 'Switching chapters...' : 
           'Loading editor...'}
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
