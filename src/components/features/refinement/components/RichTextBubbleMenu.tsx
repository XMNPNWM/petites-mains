
import React from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic } from 'lucide-react';

interface RichTextBubbleMenuProps {
  editor: Editor | null;
}

const RichTextBubbleMenu = ({ editor }: RichTextBubbleMenuProps) => {
  if (!editor || editor.isDestroyed) return null;

  const handleBold = () => {
    if (!editor.isDestroyed) {
      editor.chain().focus().toggleBold().run();
    }
  };

  const handleItalic = () => {
    if (!editor.isDestroyed) {
      editor.chain().focus().toggleItalic().run();
    }
  };

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        appendTo: () => document.body,
        placement: 'top',
        zIndex: 1000,
        interactive: true,
        trigger: 'mouseenter focus',
        hideOnClick: false
      }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;
        const { empty } = selection;
        return !empty && !editor.isDestroyed;
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
