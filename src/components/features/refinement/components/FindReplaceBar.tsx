
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceBarProps {
  editor: Editor;
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

  const findMatches = () => {
    if (!editor || !findText) {
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
  };

  const handleFind = (direction: 'next' | 'prev' = 'next') => {
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
    editor.commands.setTextSelection({
      from: matchPosition,
      to: matchPosition + findText.length
    });
  };

  const handleReplace = () => {
    if (!editor || !findText || !replaceText) return;
    
    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
    
    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      editor.chain().focus().insertContent(replaceText).run();
      onContentChange(editor.getHTML());
      handleFind('next');
    }
  };

  const handleReplaceAll = () => {
    if (!editor || !findText || !replaceText) return;
    
    const content = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceText);
    
    editor.commands.setContent(newContent);
    onContentChange(newContent);
    
    setCurrentMatch(0);
    setTotalMatches(0);
  };

  React.useEffect(() => {
    if (findText) {
      findMatches();
    }
  }, [findText, editor]);

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
        <Button size="sm" variant="ghost" onClick={() => handleFind('prev')} className="h-8 w-8 p-0">
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleFind('next')} className="h-8 w-8 p-0">
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
        <Button size="sm" onClick={handleReplace}>Replace</Button>
        <Button size="sm" onClick={handleReplaceAll}>Replace All</Button>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FindReplaceBar;
