
import React, { useCallback } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StorylineNode as StorylineNodeType } from './types';

interface StorylineNodeProps {
  node: StorylineNodeType;
  zoom: number;
  pan: { x: number; y: number };
  isDragged: boolean;
  isSelected: boolean;
  isConnectionSource: boolean;
  onEdit: (node: StorylineNodeType) => void;
  onDelete: (nodeId: string) => void;
  onDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
  setDraggedNode: (nodeId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

const StorylineNode = React.memo(({ 
  node, 
  zoom,
  pan,
  isDragged, 
  isSelected,
  isConnectionSource,
  onEdit, 
  onDelete, 
  onDrag,
  onConnectionStart,
  onConnectionFinish,
  setDraggedNode,
  setSelectedNode
}: StorylineNodeProps) => {
  const nodeWidth = 112; // w-28 = 112px
  const nodeHeight = 80; // approximate height

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if Ctrl/Cmd key is pressed for connection creation
    if (e.ctrlKey || e.metaKey) {
      const nodeCenter = {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight / 2
      };
      onConnectionStart(node.id, nodeCenter);
      return;
    }

    // Select the node
    setSelectedNode(node.id);

    // Get the canvas container
    const canvas = e.currentTarget.closest('.overflow-hidden') as HTMLElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to world coordinates
    const mouseWorldPos = screenToWorld(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
    const dragOffset = {
      x: mouseWorldPos.x - node.position.x,
      y: mouseWorldPos.y - node.position.y
    };

    // Start dragging immediately
    setDraggedNode(node.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      // Convert current mouse position to world coordinates
      const currentMouseWorldPos = screenToWorld(moveEvent.clientX - canvasRect.left, moveEvent.clientY - canvasRect.top);
      
      const newPosition = {
        x: currentMouseWorldPos.x - dragOffset.x,
        y: currentMouseWorldPos.y - dragOffset.y
      };

      onDrag(node.id, newPosition);
    };

    const handleMouseUp = () => {
      setDraggedNode(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [node, screenToWorld, setDraggedNode, setSelectedNode, onDrag, onConnectionStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // If we're in connection creation mode and this is not the source node
    if (!isConnectionSource) {
      e.preventDefault();
      e.stopPropagation();
      onConnectionFinish(node.id);
    }
  }, [isConnectionSource, onConnectionFinish, node.id]);

  const handleConnectionCircleClick = useCallback((e: React.MouseEvent, position: 'top' | 'right' | 'bottom' | 'left') => {
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
  }, [node, onConnectionStart]);

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
});

StorylineNode.displayName = 'StorylineNode';

export default StorylineNode;
