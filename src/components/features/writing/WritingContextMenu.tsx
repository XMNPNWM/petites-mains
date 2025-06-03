
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MessageSquare, Brain, ArrowRight, MessageCircle } from 'lucide-react';
import { SelectedTextContext } from '@/types/comments';

interface WritingContextMenuProps {
  children: React.ReactNode;
  onComment: (position: { x: number; y: number }, selectedText?: SelectedTextContext) => void;
  onCoherence: (position: { x: number; y: number }) => void;
  onNextSteps: (position: { x: number; y: number }) => void;
  onChat: (position: { x: number; y: number }) => void;
}

const WritingContextMenu = ({
  children,
  onComment,
  onCoherence,
  onNextSteps,
  onChat
}: WritingContextMenuProps) => {
  const [contextPosition, setContextPosition] = React.useState({ x: 0, y: 0 });

  const handleContextMenu = (event: React.MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const getSelectedTextContext = (): SelectedTextContext | null => {
    return (window as any).selectedTextContext || null;
  };

  const handleCommentClick = () => {
    const selectedText = getSelectedTextContext();
    onComment(contextPosition, selectedText);
  };

  const selectedText = getSelectedTextContext();

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-white border border-slate-200 shadow-lg z-30">
        <ContextMenuItem 
          onClick={handleCommentClick}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <div className="flex flex-col">
            <span>Comment</span>
            {selectedText && (
              <span className="text-xs text-slate-500 truncate max-w-40">
                on "{selectedText.text}"
              </span>
            )}
          </div>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onCoherence(contextPosition)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <Brain className="w-4 h-4 text-purple-600" />
          <span>AI/Coherence</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onNextSteps(contextPosition)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-green-600" />
          <span>AI/Next Steps</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onChat(contextPosition)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-orange-600" />
          <span>Chat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default WritingContextMenu;
