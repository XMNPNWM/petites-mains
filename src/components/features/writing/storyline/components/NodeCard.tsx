
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorylineNode } from '../types';
import { getNodeTypeColor } from '../constants/nodeConstants';
import { getNodeTypeDisplayName } from '../utils/nodeTypeUtils';

interface NodeCardProps {
  node: StorylineNode;
  isSelected: boolean;
  onEdit: (node: StorylineNode) => void;
  onDelete: (nodeId: string) => void;
}

const NodeCard = React.memo(({ node, isSelected, onEdit, onDelete }: NodeCardProps) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(node);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node.id);
  };

  const displayName = getNodeTypeDisplayName(node.node_type);
  const nodeTypeColor = getNodeTypeColor(node.node_type);

  return (
    <Card className={`w-40 h-32 cursor-pointer transition-all duration-200 hover:shadow-md group ${
      isSelected ? 'ring-2 ring-purple-400 ring-opacity-60' : ''
    } border-2 ${nodeTypeColor.border}`}>
      <CardContent className="p-3 h-full flex flex-col relative">
        {/* Action buttons - appear on hover */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5 z-10">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 hover:bg-slate-100"
            onClick={handleEdit}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 hover:bg-slate-100"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1 pr-1">
            {node.title}
          </h3>
        </div>
        
        <div className="flex-1 mb-2">
          {node.content && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {node.content}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className="text-xs px-2 py-1"
            style={{ 
              backgroundColor: `rgba(${nodeTypeColor.rgb}, 0.1)`,
              color: `rgb(${nodeTypeColor.rgb})`
            }}
          >
            {displayName}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});

NodeCard.displayName = 'NodeCard';

export default NodeCard;
