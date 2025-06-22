
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
  const handleBold = () => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
    }
  };

  const handleItalic = () => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
    }
  };

  const handleHeadingChange = (value: string) => {
    if (!editor) return;
    
    if (value === '0') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const getCurrentHeadingLevel = () => {
    if (!editor) return '0';
    
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return i.toString();
      }
    }
    return '0';
  };

  return (
    <div className="border-b border-slate-200 p-2 flex items-center space-x-2 bg-white sticky top-0 z-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBold}
        className={`h-8 w-8 p-0 ${editor?.isActive('bold') ? 'bg-slate-200' : ''}`}
        disabled={!editor}
      >
        <Bold className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleItalic}
        className={`h-8 w-8 p-0 ${editor?.isActive('italic') ? 'bg-slate-200' : ''}`}
        disabled={!editor}
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <Select value={getCurrentHeadingLevel()} onValueChange={handleHeadingChange} disabled={!editor}>
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
