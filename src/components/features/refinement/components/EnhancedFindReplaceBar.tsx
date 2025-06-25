
import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface EnhancedFindReplaceBarProps {
  editor: Editor | null;
  onClose: () => void;
  disabled?: boolean;
}

const EnhancedFindReplaceBar = ({
  editor,
  onClose,
  disabled = false
}: EnhancedFindReplaceBarProps) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const handleFind = useCallback((direction: 'next' | 'prev' = 'next') => {
    if (!editor || editor.isDestroyed || !findText || disabled) return;
    
    try {
      editor.commands.find(findText);
    } catch (error) {
      console.warn('Find operation failed:', error);
    }
  }, [editor, findText, disabled]);

  const handleReplace = useCallback(() => {
    if (!editor || editor.isDestroyed || !findText || !replaceText || disabled) return;
    
    try {
      const success = editor.commands.replace(findText, replaceText);
      if (success) {
        // Find next occurrence after replacement
        setTimeout(() => handleFind('next'), 50);
      }
    } catch (error) {
      console.warn('Replace operation failed:', error);
    }
  }, [editor, findText, replaceText, handleFind, disabled]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || editor.isDestroyed || !findText || !replaceText || disabled) return;
    
    try {
      editor.commands.replaceAll(findText, replaceText);
      setMatchCount(0);
    } catch (error) {
      console.warn('Replace all operation failed:', error);
    }
  }, [editor, findText, replaceText, disabled]);

  const isEditorReady = editor && !editor.isDestroyed && !disabled;

  return (
    <div className="border-b border-slate-200 p-2 flex items-center space-x-2 bg-slate-50">
      <div className="flex items-center space-x-1">
        <Input
          type="text"
          placeholder="Find..."
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          className="h-8 w-32 text-sm"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) {
              handleFind('next');
            }
          }}
        />
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => handleFind('prev')} 
          className="h-8 w-8 p-0"
          disabled={!isEditorReady || !findText}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => handleFind('next')} 
          className="h-8 w-8 p-0"
          disabled={!isEditorReady || !findText}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-1">
        <Input
          type="text"
          placeholder="Replace..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          className="h-8 w-32 text-sm"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) {
              handleReplace();
            }
          }}
        />
        <Button 
          size="sm" 
          onClick={handleReplace}
          disabled={!isEditorReady || !findText || !replaceText}
        >
          Replace
        </Button>
        <Button 
          size="sm" 
          onClick={handleReplaceAll}
          disabled={!isEditorReady || !findText || !replaceText}
        >
          All
        </Button>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default EnhancedFindReplaceBar;
