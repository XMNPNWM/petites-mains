
import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StorylineNodeData {
  id: string;
  title: string;
  content: string;
  node_type: string;
  position: { x: number; y: number };
}

interface StorylineNodeProps {
  node: StorylineNodeData;
  isDragged: boolean;
  onEdit: (node: StorylineNodeData) => void;
  onDelete: (nodeId: string) => void;
  onDragStart: (e: React.MouseEvent, node: StorylineNodeData) => void;
}

const StorylineNode = ({ node, isDragged, onEdit, onDelete, onDragStart }: StorylineNodeProps) => {
  return (
    <div
      className="absolute cursor-move storyline-node"
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isDragged ? 10 : 1
      }}
      onMouseDown={(e) => onDragStart(e, node)}
    >
      <Card className="w-28 hover:shadow-lg transition-shadow group">
        <CardContent className="p-2">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-xs font-medium text-slate-900 line-clamp-2">
              {node.title}
            </h4>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-3 w-3"
                onClick={(e) => {
                  e.stopPropagation();
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
                  onDelete(node.id);
                }}
              >
                <Trash2 className="w-1.5 h-1.5" />
              </Button>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
            {node.node_type}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorylineNode;
