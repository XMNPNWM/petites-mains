
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

  const calculateLineNumber = (textarea: HTMLTextAreaElement): number => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // Fallback: get cursor position if no selection
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        return textBeforeCursor.split('\n').length;
      }

      const range = selection.getRangeAt(0);
      const textBeforeSelection = textarea.value.substring(0, range.startOffset);
      return textBeforeSelection.split('\n').length;
    } catch (error) {
      console.warn('Error calculating line number:', error);
      return 1;
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
    
    // Enhanced text selection and line number capture
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    setContextSelectedText(selectedText && selectedText.length > 0 ? selectedText : undefined);
    
    // Find the textarea and calculate accurate line number
    const textareas = document.querySelectorAll('textarea');
    let calculatedLineNumber = 1;
    
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 100) { // Find the main content textarea
        calculatedLineNumber = calculateLineNumber(textarea);
        break;
      }
    }
    
    setContextLineNumber(calculatedLineNumber);
    
    console.log('Context menu - captured data:', {
      selectedText: selectedText || 'none',
      lineNumber: calculatedLineNumber,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleMenuItemClick = (type: 'comment' | 'chat') => {
    console.log('Menu item clicked:', {
      type,
      position: contextPosition,
      selectedText: contextSelectedText,
      lineNumber: contextLineNumber
    });
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
          <div className="flex flex-col">
            <span>Comment</span>
            {contextSelectedText && (
              <span className="text-xs text-slate-500 truncate max-w-40">
                Line {contextLineNumber}: "{contextSelectedText}"
              </span>
            )}
            {!contextSelectedText && (
              <span className="text-xs text-slate-500">
                Line {contextLineNumber}
              </span>
            )}
          </div>
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
