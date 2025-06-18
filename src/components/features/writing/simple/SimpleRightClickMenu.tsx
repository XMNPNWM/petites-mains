
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
  const [contextLineNumber, setContextLineNumber] = useState<number | null>(null);
  const [isFromTextEditor, setIsFromTextEditor] = useState(false);

  const findMainTextarea = (): HTMLTextAreaElement | null => {
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 100) {
        return textarea;
      }
    }
    return textareas.length > 0 ? textareas[0] : null;
  };

  const calculateLineNumberFromCursor = (textarea: HTMLTextAreaElement): number => {
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    return textBeforeCursor.split('\n').length;
  };

  const isEventWithinTextarea = (event: React.MouseEvent, textarea: HTMLTextAreaElement): boolean => {
    const rect = textarea.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
    
    const mainTextarea = findMainTextarea();
    let selectedText: string | undefined;
    let lineNumber: number | null = null;
    let withinTextEditor = false;

    if (mainTextarea) {
      // Check if the right-click occurred within the textarea bounds
      withinTextEditor = isEventWithinTextarea(event, mainTextarea);
      
      if (withinTextEditor && document.activeElement === mainTextarea) {
        // Get selected text if any
        const selection = mainTextarea.value.substring(
          mainTextarea.selectionStart, 
          mainTextarea.selectionEnd
        );
        selectedText = selection.trim() || undefined;
        
        // Calculate accurate line number from cursor position
        lineNumber = calculateLineNumberFromCursor(mainTextarea);
        
        console.log('Context menu - captured from text editor:', {
          selectedText: selectedText || 'none',
          lineNumber,
          cursorPosition: mainTextarea.selectionStart,
          withinTextEditor: true
        });
      } else {
        console.log('Context menu - created outside text editor:', {
          withinTextEditor: false,
          activeElement: document.activeElement?.tagName
        });
      }
    }

    setContextSelectedText(selectedText);
    setContextLineNumber(lineNumber);
    setIsFromTextEditor(withinTextEditor);
  };

  const handleMenuItemClick = (type: 'comment' | 'chat') => {
    console.log('Menu item clicked with enhanced context data:', {
      type,
      position: contextPosition,
      selectedText: contextSelectedText,
      lineNumber: contextLineNumber,
      isFromTextEditor,
      hasValidNavigation: !!(isFromTextEditor && contextLineNumber)
    });
    
    onMenuClick(
      type, 
      contextPosition, 
      contextSelectedText, 
      isFromTextEditor ? contextLineNumber || undefined : undefined
    );
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
            {isFromTextEditor && contextLineNumber ? (
              <>
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
              </>
            ) : (
              <span className="text-xs text-orange-500">
                No navigation info
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
