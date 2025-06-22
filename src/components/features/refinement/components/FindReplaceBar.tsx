
import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';

interface FindReplaceBarProps {
  editor: Editor;
  findText: string;
  replaceText: string;
  onFindTextChange: (text: string) => void;
  onReplaceTextChange: (text: string) => void;
  onContentChange: (content: string) => void;
}

const FindReplaceBar = ({
  editor,
  findText,
  replaceText,
  onFindTextChange,
  onReplaceTextChange,
  onContentChange
}: FindReplaceBarProps) => {
  const handleFind = () => {
    if (editor && findText) {
      const { state } = editor;
      const { doc } = state;
      let found = false;
      
      doc.descendants((node, pos) => {
        if (node.isText && node.text?.includes(findText)) {
          editor.commands.setTextSelection({ from: pos, to: pos + findText.length });
          found = true;
          return false;
        }
      });
      
      if (!found) {
        console.log('Text not found');
      }
    }
  };

  const handleReplace = () => {
    if (editor && findText && replaceText) {
      const content = editor.getHTML();
      const newContent = content.replace(new RegExp(findText, 'g'), replaceText);
      editor.commands.setContent(newContent);
      onContentChange(newContent);
    }
  };

  return (
    <div className="border-b border-slate-200 p-2 flex items-center space-x-2 bg-slate-50">
      <input
        type="text"
        placeholder="Find..."
        value={findText}
        onChange={(e) => onFindTextChange(e.target.value)}
        className="px-2 py-1 border border-slate-300 rounded text-sm"
      />
      <input
        type="text"
        placeholder="Replace..."
        value={replaceText}
        onChange={(e) => onReplaceTextChange(e.target.value)}
        className="px-2 py-1 border border-slate-300 rounded text-sm"
      />
      <Button size="sm" onClick={handleFind}>Find</Button>
      <Button size="sm" onClick={handleReplace}>Replace All</Button>
    </div>
  );
};

export default FindReplaceBar;
