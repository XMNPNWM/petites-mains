
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Minimize2, Maximize2, X, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  selectedText?: string;
  isMinimized: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMinimize: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

const ChatHeader = ({ 
  selectedText, 
  isMinimized, 
  onMouseDown, 
  onMinimize, 
  onClose,
  onDelete
}: ChatHeaderProps) => {
  return (
    <div 
      className="flex items-center justify-between p-4 border-b bg-blue-50 cursor-move"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-800">AI Chat</h3>
        {selectedText && (
          <span className="text-xs text-slate-500 truncate max-w-[200px]">
            "{selectedText}"
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 p-0 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMinimize();
          }}
          className="h-8 w-8 p-0 hover:bg-blue-100"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="h-8 w-8 p-0 hover:bg-red-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
