
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
      setHighlightStyle({});
      return;
    }

    console.log('🎨 Applying highlight to range:', highlightedRange);

    // Add CSS for highlighting
    const highlightCSS = `
      .highlighted-change {
        background: rgba(251, 191, 36, 0.3) !important;
        border: 2px solid rgb(251, 191, 36) !important;
        border-radius: 4px !important;
        animation: highlight-pulse 2s ease-in-out !important;
      }
      
      @keyframes highlight-pulse {
        0%, 100% { 
          background: rgba(251, 191, 36, 0.3);
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
        }
        50% { 
          background: rgba(251, 191, 36, 0.5);
          box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2);
        }
      }
    `;

    // Inject or update styles
    let styleElement = document.getElementById('change-highlight-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'change-highlight-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = highlightCSS;

    // Apply highlighting using CSS classes and DOM manipulation
    const editorElement = editorRef.current.querySelector('.ProseMirror');
    if (editorElement) {
      // Remove existing highlights
      const existingHighlights = editorElement.querySelectorAll('.highlighted-change');
      existingHighlights.forEach(el => {
        el.classList.remove('highlighted-change');
      });

      // Simple text-based highlighting for now
      setTimeout(() => {
        const textNodes = [];
        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }

        // Find and highlight the range (simplified approach)
        let currentPos = 0;
        for (const textNode of textNodes) {
          const nodeLength = textNode.textContent?.length || 0;
          const nodeStart = currentPos;
          const nodeEnd = currentPos + nodeLength;

          if (highlightedRange.start < nodeEnd && highlightedRange.end > nodeStart) {
            const parentElement = textNode.parentElement;
            if (parentElement) {
              parentElement.classList.add('highlighted-change');
            }
          }

          currentPos = nodeEnd;
        }
      }, 100);
    }

    // Clear highlight after 5 seconds
    const timer = setTimeout(() => {
      const highlightedElements = editorRef.current?.querySelectorAll('.highlighted-change');
      highlightedElements?.forEach(el => {
        el.classList.remove('highlighted-change');
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
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
      // Cleanup styles
      const styleElement = document.getElementById('change-highlight-styles');
      if (styleElement) {
        styleElement.remove();
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
