
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FindReplaceDialog from './FindReplaceDialog';
import { findAndReplace } from '@/lib/textFormattingUtils';

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (content: string) => void;
}

const FormattingToolbar = ({ textareaRef, content, onContentChange }: FormattingToolbarProps) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const { toast } = useToast();

  const handleFindReplace = (findText: string, replaceText: string, replaceAll: boolean) => {
    const result = findAndReplace(content, findText, replaceText, replaceAll);
    
    if (result.replacements > 0) {
      onContentChange(result.newContent);
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
