
import React, { useEffect, useState } from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic } from 'lucide-react';

interface RichTextBubbleMenuProps {
  editor: Editor | null;
}

const RichTextBubbleMenu = ({ editor }: RichTextBubbleMenuProps) => {
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setIsStable(false);
      return;
    }

    // Add small delay to ensure editor is fully initialized
    const timer = setTimeout(() => {
      if (!editor.isDestroyed) {
        setIsStable(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsStable(false);
    };
  }, [editor]);

  if (!editor || editor.isDestroyed || !isStable) return null;

  const handleBold = () => {
    try {
      if (!editor.isDestroyed) {
        editor.chain().focus().toggleBold().run();
      }
    } catch (error) {
      console.warn('Error toggling bold:', error);
    }
  };

  const handleItalic = () => {
    try {
      if (!editor.isDestroyed) {
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
        hideOnClick: false
      }}
      shouldShow={({ editor, state }) => {
        try {
          if (!editor || editor.isDestroyed) return false;
          const { selection } = state;
          const { empty } = selection;
          return !empty && !editor.isDestroyed;
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
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
};

export default RichTextBubbleMenu;
