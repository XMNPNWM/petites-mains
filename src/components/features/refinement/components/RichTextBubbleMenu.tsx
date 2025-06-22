
import React from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic } from 'lucide-react';

interface RichTextBubbleMenuProps {
  editor: Editor;
}

const RichTextBubbleMenu = ({ editor }: RichTextBubbleMenuProps) => {
  if (!editor) return null;

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        appendTo: () => document.body,
        placement: 'top',
        zIndex: 1000
      }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;
        const { empty } = selection;
        return !empty;
      }}
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex items-center space-x-1 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
};

export default RichTextBubbleMenu;
