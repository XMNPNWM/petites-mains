import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StorylineNode as StorylineNodeType } from './types';

interface StorylineNodeProps {
  node: StorylineNodeType;
  isDragged: boolean;
  isSelected: boolean;
  isConnectionSource: boolean;
  onEdit: (node: StorylineNodeType) => void;
  onDelete: (nodeId: string) => void;
  onClick: (e: React.MouseEvent, node: StorylineNodeType) => void;
  onDragStart: (e: React.MouseEvent, node: StorylineNodeType) => void;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
}

const StorylineNode = ({ 
  node, 
  isDragged, 
  isSelected,
  isConnectionSource,
  onEdit, 
  onDelete, 
  onClick,
  onDragStart,
  onConnectionStart,
  onConnectionFinish
}: StorylineNodeProps) => {
  const nodeWidth = 112; // w-28 = 112px
  const nodeHeight = 80; // approximate height

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if Ctrl/Cmd key is pressed for connection creation
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const nodeCenter = {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight / 2
      };
      onConnectionStart(node.id, nodeCenter);
      return;
    }
    
    // Handle click for selection
    onClick(e, node);
    
    // Start drag after a small delay to distinguish between click and drag
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // If mouse moved more than 5px, start dragging
      if (deltaX > 5 || deltaY > 5) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        onDragStart(e, node);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If we're in connection creation mode and this is not the source node
    if (!isConnectionSource) {
      e.preventDefault();
      e.stopPropagation();
      onConnectionFinish(node.id);
    }
  };

  const handleConnectionCircleClick = (e: React.MouseEvent, position: 'top' | 'right' | 'bottom' | 'left') => {
    e.preventDefault();
    e.stopPropagation();
    
    let connectionPoint = { x: 0, y: 0 };
    
    switch (position) {
      case 'top':
        connectionPoint = { x: node.position.x + nodeWidth / 2, y: node.position.y };
        break;
      case 'right':
        connectionPoint = { x: node.position.x + nodeWidth, y: node.position.y + nodeHeight / 2 };
        break;
      case 'bottom':
        connectionPoint = { x: node.position.x + nodeWidth / 2, y: node.position.y + nodeHeight };
        break;
      case 'left':
        connectionPoint = { x: node.position.x, y: node.position.y + nodeHeight / 2 };
        break;
    }
    
    onConnectionStart(node.id, connectionPoint);
  };

  // Determine the visual state of the node
  const getNodeClassName = () => {
    let className = "absolute cursor-move storyline-node select-none group";
    
    if (isConnectionSource) {
      className += " ring-2 ring-blue-400";
    } else if (isSelected) {
      className += " ring-2 ring-purple-400 ring-opacity-60";
    }
    
    return className;
  };

  const getCardClassName = () => {
    let className = "w-28 hover:shadow-lg transition-all duration-200 select-none";
    
    if (isSelected) {
      className += " shadow-lg border-purple-300";
    }
    
    return className;
  };

  return (
    <div
      className={getNodeClassName()}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isDragged ? 10 : isSelected ? 5 : 1,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      unselectable="on"
    >
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

      {/* Connection Circles */}
      {/* Top Circle */}
      <div
        className="absolute w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 border border-white shadow-sm"
        style={{
          left: '50%',
          top: '-6px',
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => handleConnectionCircleClick(e, 'top')}
        title="Create connection from top"
      />

      {/* Right Circle */}
      <div
        className="absolute w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 border border-white shadow-sm"
        style={{
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseDown={(e) => handleConnectionCircleClick(e, 'right')}
        title="Create connection from right"
      />

      {/* Bottom Circle */}
      <div
        className="absolute w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 border border-white shadow-sm"
        style={{
          left: '50%',
          bottom: '-6px',
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => handleConnectionCircleClick(e, 'bottom')}
        title="Create connection from bottom"
      />

      {/* Left Circle */}
      <div
        className="absolute w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 border border-white shadow-sm"
        style={{
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseDown={(e) => handleConnectionCircleClick(e, 'left')}
        title="Create connection from left"
      />
    </div>
  );
};

export default StorylineNode;
