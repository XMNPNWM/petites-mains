
import React, { useEffect, useState } from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic } from 'lucide-react';

interface RichTextBubbleMenuProps {
  editor: Editor | null;
  isTransitioning?: boolean; // New prop to handle transitions
}

const RichTextBubbleMenu = ({ editor, isTransitioning = false }: RichTextBubbleMenuProps) => {
  const [isStable, setIsStable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed || isTransitioning) {
      setIsStable(false);
      return;
    }

    // Add delay to ensure editor is fully initialized and stable
    const timer = setTimeout(() => {
      if (!editor.isDestroyed && isMounted && !isTransitioning) {
        setIsStable(true);
      }
    }, 150); // Increased delay for better stability

    return () => {
      clearTimeout(timer);
      setIsStable(false);
    };
  }, [editor, isTransitioning, isMounted]);

  // Don't render bubble menu during transitions or when editor is not stable
  if (!editor || editor.isDestroyed || !isStable || !isMounted || isTransitioning) {
    return null;
  }

  const handleBold = () => {
    try {
      if (!editor.isDestroyed && !isTransitioning) {
        editor.chain().focus().toggleBold().run();
      }
    } catch (error) {
      console.warn('Error toggling bold:', error);
    }
  };

  const handleItalic = () => {
    try {
      if (!editor.isDestroyed && !isTransitioning) {
        editor.chain().focus().toggleItalic().run();
      }
    } catch (error) {
      console.warn('Error toggling italic:', error);
    }
  };

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        zIndex: 1000,
        interactive: true,
        hideOnClick: false,
        onHidden: () => {
          // Clean up any references when bubble menu is hidden
          console.log('BubbleMenu: Hidden');
        }
      }}
      shouldShow={({ editor, state }) => {
        try {
          if (!editor || editor.isDestroyed || isTransitioning || !isMounted) {
            return false;
          }
          const { selection } = state;
          const { empty } = selection;
          return !empty && !editor.isDestroyed && !isTransitioning;
        } catch (error) {
          console.warn('Error in BubbleMenu shouldShow:', error);
          return false;
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex items-center space-x-1 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBold}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
          disabled={isTransitioning}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
          disabled={isTransitioning}
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
};

export default RichTextBubbleMenu;
