
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StorylineNode } from '../types';
import NodeActionButtons from './NodeActionButtons';

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
          <NodeActionButtons
            node={node}
            onEdit={onEdit}
            onDelete={onDelete}
          />
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
