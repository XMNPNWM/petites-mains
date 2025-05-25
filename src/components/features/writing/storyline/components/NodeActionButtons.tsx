
import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorylineNode } from '../types';

interface NodeActionButtonsProps {
  node: StorylineNode;
  onEdit: (node: StorylineNode) => void;
  onDelete: (nodeId: string) => void;
}

const NodeActionButtons = React.memo(({ node, onEdit, onDelete }: NodeActionButtonsProps) => {
  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-3 w-3"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEdit(node);
        }}
      >
        <Edit3 className="w-1.5 h-1.5" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-3 w-3"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete(node.id);
        }}
      >
        <Trash2 className="w-1.5 h-1.5" />
      </Button>
    </div>
  );
});

NodeActionButtons.displayName = 'NodeActionButtons';

export default NodeActionButtons;
