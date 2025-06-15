
import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MessageSquare, MessageCircle } from 'lucide-react';

interface SimpleRightClickMenuProps {
  children: React.ReactNode;
  onMenuClick: (type: 'comment' | 'chat', position: { x: number; y: number }, selectedText?: string, lineNumber?: number) => void;
}

const SimpleRightClickMenu = ({
  children,
  onMenuClick
}: SimpleRightClickMenuProps) => {
  const [contextPosition, setContextPosition] = useState({ x: 0, y: 0 });
  const [contextSelectedText, setContextSelectedText] = useState<string | undefined>(undefined);
  const [contextLineNumber, setContextLineNumber] = useState<number>(1);

  const handleContextMenu = (event: React.MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
    
    // Capture selected text and line number at the exact moment of right-click
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    setContextSelectedText(selectedText && selectedText.length > 0 ? selectedText : undefined);
    
    // Calculate line number based on cursor position
    const textarea = document.querySelector('textarea');
    if (textarea && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBefore = textarea.value.substring(0, range.startOffset);
      const lineNumber = textBefore.split('\n').length;
      setContextLineNumber(lineNumber);
    } else {
      setContextLineNumber(1);
    }
  };

  const handleMenuItemClick = (type: 'comment' | 'chat') => {
    onMenuClick(type, contextPosition, contextSelectedText, contextLineNumber);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger 
        className="h-full w-full"
        onContextMenu={handleContextMenu}
        asChild
      >
        <div className="h-full w-full">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-white border border-slate-200 shadow-lg z-[400]">
        <ContextMenuItem 
          onClick={() => handleMenuItemClick('comment')}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Comment</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => handleMenuItemClick('chat')}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-orange-600" />
          <span>Chat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default SimpleRightClickMenu;
