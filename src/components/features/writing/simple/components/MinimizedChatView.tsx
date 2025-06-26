
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

interface MinimizedChatViewProps {
  position: { x: number; y: number };
  isDragging: boolean;
  onExpand: () => void;
  onClose: () => void;
}

const MinimizedChatView = ({ 
  position, 
  isDragging, 
  onExpand, 
  onClose 
}: MinimizedChatViewProps) => {
  return (
    <Card 
      className="fixed bg-white shadow-lg border-2 border-blue-200 cursor-pointer hover:shadow-xl transition-all duration-200 z-[9999]"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: isDragging ? 'rotate(2deg)' : 'none'
      }}
      onClick={onExpand}
    >
      <div className="flex items-center p-3 space-x-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-2 h-6 w-6 p-0 hover:bg-red-100"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export default MinimizedChatView;
