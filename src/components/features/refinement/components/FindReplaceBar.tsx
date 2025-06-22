
import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceBarProps {
  editor: Editor | null;
  findText: string;
  replaceText: string;
  onFindTextChange: (text: string) => void;
  onReplaceTextChange: (text: string) => void;
  onContentChange: (content: string) => void;
  onClose: () => void;
}

const FindReplaceBar = ({
  editor,
  findText,
  replaceText,
  onFindTextChange,
  onReplaceTextChange,
  onContentChange,
  onClose
}: FindReplaceBarProps) => {
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const findMatches = useCallback(() => {
    if (!editor || editor.isDestroyed || !findText) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return [];
    }

    const content = editor.getText().toLowerCase();
    const searchTerm = findText.toLowerCase();
    const matches = [];
    let index = content.indexOf(searchTerm);
    
    while (index !== -1) {
      matches.push(index);
      index = content.indexOf(searchTerm, index + 1);
    }
    
    setTotalMatches(matches.length);
    return matches;
  }, [editor, findText]);

  const handleFind = useCallback((direction: 'next' | 'prev' = 'next') => {
    if (!editor || editor.isDestroyed) return;
    
    const matches = findMatches();
    if (matches.length === 0) return;

    let nextMatch = currentMatch;
    if (direction === 'next') {
      nextMatch = (currentMatch + 1) % matches.length;
    } else {
      nextMatch = currentMatch === 0 ? matches.length - 1 : currentMatch - 1;
    }

    setCurrentMatch(nextMatch);
    
    // Highlight the match
    const matchPosition = matches[nextMatch];
    if (matchPosition !== undefined) {
      editor.commands.setTextSelection({
        from: matchPosition,
        to: matchPosition + findText.length
      });
    }
  }, [editor, findMatches, currentMatch, findText]);

  const handleReplace = useCallback(() => {
    if (!editor || editor.isDestroyed || !findText || !replaceText) return;
    
    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
    
    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      editor.chain().focus().insertContent(replaceText).run();
      onContentChange(editor.getHTML());
      handleFind('next');
    }
  }, [editor, findText, replaceText, onContentChange, handleFind]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || editor.isDestroyed || !findText || !replaceText) return;
    
    const content = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceText);
    
    editor.commands.setContent(newContent);
    onContentChange(newContent);
    
    setCurrentMatch(0);
    setTotalMatches(0);
  }, [editor, findText, replaceText, onContentChange]);

  useEffect(() => {
    if (findText && editor && !editor.isDestroyed) {
      findMatches();
    }
  }, [findText, editor, findMatches]);

  const isEditorReady = editor && !editor.isDestroyed;

  return (
    <div className="border-b border-slate-200 p-2 flex items-center space-x-2 bg-slate-50">
      <div className="flex items-center space-x-1">
        <Input
          type="text"
          placeholder="Find..."
          value={findText}
          onChange={(e) => onFindTextChange(e.target.value)}
          className="h-8 w-32 text-sm"
        />
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => handleFind('prev')} 
          className="h-8 w-8 p-0"
          disabled={!isEditorReady || totalMatches === 0}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => handleFind('next')} 
          className="h-8 w-8 p-0"
          disabled={!isEditorReady || totalMatches === 0}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
        {totalMatches > 0 && (
          <span className="text-xs text-slate-600">
            {currentMatch + 1} of {totalMatches}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <Input
          type="text"
          placeholder="Replace..."
          value={replaceText}
          onChange={(e) => onReplaceTextChange(e.target.value)}
          className="h-8 w-32 text-sm"
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
          Replace All
        </Button>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FindReplaceBar;
