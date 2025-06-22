
import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EnhancedRichTextToolbarProps {
  editor: Editor | null;
  onFindReplaceToggle: () => void;
}

const EnhancedRichTextToolbar = ({ editor, onFindReplaceToggle }: EnhancedRichTextToolbarProps) => {
  const handleBold = () => {
    if (editor && !editor.isDestroyed) {
      // Maintain focus and selection
      editor.chain().focus().toggleBold().run();
    }
  };

  const handleItalic = () => {
    if (editor && !editor.isDestroyed) {
      // Maintain focus and selection
      editor.chain().focus().toggleItalic().run();
    }
  };

  const handleHeadingChange = (value: string) => {
    if (!editor || editor.isDestroyed) return;
    
    editor.chain().focus();
    
    if (value === '0') {
      editor.chain().setParagraph().run();
    } else {
      const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().toggleHeading({ level }).run();
    }
  };

  const getCurrentHeadingLevel = () => {
    if (!editor || editor.isDestroyed) return '0';
    
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return i.toString();
      }
    }
    return '0';
  };

  const isEditorReady = editor && !editor.isDestroyed;

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        onClick={handleBold}
        className={`h-8 w-8 p-0 ${isEditorReady && editor.isActive('bold') ? 'bg-slate-200' : ''}`}
        disabled={!isEditorReady}
      >
        <Bold className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        onClick={handleItalic}
        className={`h-8 w-8 p-0 ${isEditorReady && editor.isActive('italic') ? 'bg-slate-200' : ''}`}
        disabled={!isEditorReady}
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <Select 
        value={getCurrentHeadingLevel()} 
        onValueChange={handleHeadingChange} 
        disabled={!isEditorReady}
      >
        <SelectTrigger className="h-8 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Text</SelectItem>
          <SelectItem value="1">H1</SelectItem>
          <SelectItem value="2">H2</SelectItem>
          <SelectItem value="3">H3</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        onClick={onFindReplaceToggle}
        className="h-8 w-8 p-0"
        disabled={!isEditorReady}
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default EnhancedRichTextToolbar;
