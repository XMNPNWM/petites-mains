
import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MessageSquare, Brain, ArrowRight, MessageCircle } from 'lucide-react';

interface SimpleRightClickMenuProps {
  children: React.ReactNode;
  onMenuClick: (type: 'comment' | 'coherence' | 'next-steps' | 'chat', position: { x: number; y: number }, selectedText?: string) => void;
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

  const handleMenuItemClick = (type: 'comment' | 'coherence' | 'next-steps' | 'chat') => {
    const selectedText = getSelectedText();
    onMenuClick(type, contextPosition, selectedText);
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
          onClick={() => handleMenuItemClick('coherence')}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <Brain className="w-4 h-4 text-purple-600" />
          <span>AI/Coherence</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => handleMenuItemClick('next-steps')}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-green-600" />
          <span>AI/Next Steps</span>
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
