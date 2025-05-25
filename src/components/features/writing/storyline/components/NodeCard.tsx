
import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StorylineNode } from '../types';

interface NodeCardProps {
  node: StorylineNode;
  isSelected: boolean;
  onEdit: (node: StorylineNode) => void;
  onDelete: (nodeId: string) => void;
}

const NodeCard = React.memo(({ node, isSelected, onEdit, onDelete }: NodeCardProps) => {
  const getCardClassName = () => {
    let className = "w-28 hover:shadow-lg transition-all duration-200 select-none";
    
    if (isSelected) {
      className += " shadow-lg border-purple-300";
    }
    
    return className;
  };

  return (
    <Card className={getCardClassName()}>
      <CardContent className="p-2 select-none">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-xs font-medium text-slate-900 line-clamp-2 select-none">
            {node.title}
          </h4>
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
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-1 py-0.5 rounded select-none">
          {node.node_type}
        </span>
      </CardContent>
    </Card>
  );
});

NodeCard.displayName = 'NodeCard';

export default NodeCard;
