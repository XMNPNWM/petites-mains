
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
    console.log('Context menu triggered at:', event.clientX, event.clientY);
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const getSelectedTextContext = (): SelectedTextContext | null => {
    return (window as any).selectedTextContext || null;
  };

  const handleCommentClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Comment clicked, position:', contextPosition);
    const selectedText = getSelectedTextContext();
    onComment(contextPosition, selectedText);
  };

  const handleCoherenceClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Coherence clicked, position:', contextPosition);
    onCoherence(contextPosition);
  };

  const handleNextStepsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Next steps clicked, position:', contextPosition);
    onNextSteps(contextPosition);
  };

  const handleChatClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Chat clicked, position:', contextPosition);
    onChat(contextPosition);
  };

  const selectedText = getSelectedTextContext();

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
      <ContextMenuContent className="w-56 bg-white border border-slate-200 shadow-lg z-[100]">
        <ContextMenuItem 
          onClick={handleCommentClick}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
          onSelect={(e) => e.preventDefault()}
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
          onClick={handleCoherenceClick}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          <Brain className="w-4 h-4 text-purple-600" />
          <span>AI/Coherence</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={handleNextStepsClick}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          <ArrowRight className="w-4 h-4 text-green-600" />
          <span>AI/Next Steps</span>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={handleChatClick}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          <MessageCircle className="w-4 h-4 text-orange-600" />
          <span>Chat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default WritingContextMenu;
