
import React from 'react';
import { Edit3, Trash2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StorylineNode as StorylineNodeType } from './types';

interface StorylineNodeProps {
  node: StorylineNodeType;
  isDragged: boolean;
  isConnectionSource: boolean;
  onEdit: (node: StorylineNodeType) => void;
  onDelete: (nodeId: string) => void;
  onDragStart: (e: React.MouseEvent, node: StorylineNodeType) => void;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
}

const StorylineNode = ({ 
  node, 
  isDragged, 
  isConnectionSource,
  onEdit, 
  onDelete, 
  onDragStart,
  onConnectionStart,
  onConnectionFinish
}: StorylineNodeProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if Ctrl/Cmd key is pressed for connection creation
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const nodeCenter = {
        x: node.position.x + 60, // Center of node (w-28 = 112px / 2 = 56px, roughly 60)
        y: node.position.y + 30  // Center of node height
      };
      onConnectionStart(node.id, nodeCenter);
      return;
    }
    
    // Regular drag behavior
    e.preventDefault();
    onDragStart(e, node);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If we're in connection creation mode and this is not the source node
    if (!isConnectionSource) {
      e.preventDefault();
      e.stopPropagation();
      onConnectionFinish(node.id);
    }
  };

  return (
    <div
      className={`absolute cursor-move storyline-node select-none ${
        isConnectionSource ? 'ring-2 ring-blue-400' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isDragged ? 10 : 1,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      unselectable="on"
    >
      <Card className="w-28 hover:shadow-lg transition-shadow group select-none">
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
                  const nodeCenter = {
                    x: node.position.x + 60,
                    y: node.position.y + 30
                  };
                  onConnectionStart(node.id, nodeCenter);
                }}
                title="Create connection (or Ctrl+drag)"
              >
                <Link className="w-1.5 h-1.5" />
              </Button>
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
    </div>
  );
};

export default StorylineNode;
