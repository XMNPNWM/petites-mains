
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

  const handleContextMenu = (event: React.MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const getSelectedText = (): string | undefined => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    return selectedText && selectedText.length > 0 ? selectedText : undefined;
  };

  const getCurrentLineNumber = (): number => {
    // Simple line number calculation based on cursor position
    // This is a basic implementation - could be enhanced for more precision
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || '';
      return textBefore.split('\n').length;
    }
    return 1;
  };

  const handleMenuItemClick = (type: 'comment' | 'chat') => {
    const selectedText = getSelectedText();
    const lineNumber = getCurrentLineNumber();
    onMenuClick(type, contextPosition, selectedText, lineNumber);
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
