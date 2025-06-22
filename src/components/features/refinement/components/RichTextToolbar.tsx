
import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Type, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextToolbarProps {
  editor: Editor;
  onFindReplaceToggle: () => void;
}

const RichTextToolbar = ({ editor, onFindReplaceToggle }: RichTextToolbarProps) => {
  return (
    <div className="border-b border-slate-200 p-2 flex items-center space-x-2">
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
      
      <Select onValueChange={(value) => {
        if (value === '0') {
          editor.chain().focus().setParagraph().run();
        } else {
          editor.chain().focus().toggleHeading({ level: parseInt(value) as any }).run();
        }
      }}>
        <SelectTrigger className="h-8 w-24">
          <Type className="w-4 h-4" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Normal</SelectItem>
          <SelectItem value="1">H1</SelectItem>
          <SelectItem value="2">H2</SelectItem>
          <SelectItem value="3">H3</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onFindReplaceToggle}
        className="h-8 w-8 p-0"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default RichTextToolbar;
