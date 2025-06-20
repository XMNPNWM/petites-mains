
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Search, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FindReplaceDialog from './FindReplaceDialog';
import { insertFormattingAtCursor } from '@/lib/contentRenderUtils';
import {
  applyBoldFormatting,
  applyItalicFormatting,
  applyFontSize,
  findAndReplace
} from '@/lib/textFormattingUtils';

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (content: string) => void;
}

const FormattingToolbar = ({ textareaRef, content, onContentChange }: FormattingToolbarProps) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const { toast } = useToast();

  const handleBold = () => {
    if (textareaRef.current) {
      const newContent = insertFormattingAtCursor(textareaRef.current, '**');
      onContentChange(newContent);
      
      // Update textarea value and trigger events
      textareaRef.current.value = newContent;
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
    }
  };

  const handleItalic = () => {
    if (textareaRef.current) {
      const newContent = insertFormattingAtCursor(textareaRef.current, '*');
      onContentChange(newContent);
      
      // Update textarea value and trigger events
      textareaRef.current.value = newContent;
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
    }
  };

  const handleFontSize = (size: string) => {
    if (textareaRef.current) {
      const newContent = insertFormattingAtCursor(
        textareaRef.current, 
        `<span style="font-size: ${size}">`, 
        '</span>'
      );
      onContentChange(newContent);
      
      // Update textarea value and trigger events
      textareaRef.current.value = newContent;
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
    }
  };

  const handleFindReplace = (findText: string, replaceText: string, replaceAll: boolean) => {
    const result = findAndReplace(content, findText, replaceText, replaceAll);
    
    if (result.replacements > 0) {
      onContentChange(result.newContent);
      
      // Update textarea value
      if (textareaRef.current) {
        textareaRef.current.value = result.newContent;
        const event = new Event('input', { bubbles: true });
        textareaRef.current.dispatchEvent(event);
      }
      
      toast({
        title: "Text replaced",
        description: `${result.replacements} replacement${result.replacements > 1 ? 's' : ''} made.`,
      });
    } else {
      toast({
        title: "No matches found",
        description: "The search text was not found in the content.",
        variant: "destructive",
      });
    }
    
    if (replaceAll || result.replacements > 0) {
      setShowFindReplace(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        <Select onValueChange={handleFontSize}>
          <SelectTrigger className="h-8 w-20">
            <Type className="w-4 h-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12px">12px</SelectItem>
            <SelectItem value="14px">14px</SelectItem>
            <SelectItem value="16px">16px</SelectItem>
            <SelectItem value="18px">18px</SelectItem>
            <SelectItem value="20px">20px</SelectItem>
            <SelectItem value="24px">24px</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFindReplace(true)}
          className="h-8 w-8 p-0"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <FindReplaceDialog
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onFindReplace={handleFindReplace}
      />
    </>
  );
};

export default FormattingToolbar;
