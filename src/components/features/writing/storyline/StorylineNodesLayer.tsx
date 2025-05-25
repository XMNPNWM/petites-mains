
import React, { useCallback } from 'react';
import StorylineNode from './StorylineNode';
import { StorylineNode as StorylineNodeType } from './types';

interface StorylineNodesLayerProps {
  nodes: StorylineNodeType[];
  draggedNode: string | null;
  connectionCreationState: {
    isCreating: boolean;
    sourceNodeId: string | null;
    previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  };
  zoom: number;
  pan: { x: number; y: number };
  onNodeEdit: (node: StorylineNodeType) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onConnectionStart: (sourceNodeId: string, sourcePosition: { x: number; y: number }) => void;
  onConnectionFinish: (targetNodeId: string) => void;
  setDraggedNode: (nodeId: string | null) => void;
}

const StorylineNodesLayer = ({
  nodes,
  draggedNode,
  connectionCreationState,
  zoom,
  pan,
  onNodeEdit,
  onNodeDelete,
  onNodeDrag,
  onConnectionStart,
  onConnectionFinish,
  setDraggedNode
}: StorylineNodesLayerProps) => {
  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, node: StorylineNodeType) => {
    // Don't start dragging if we're in connection creation mode
    if (connectionCreationState.isCreating) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    setDraggedNode(node.id);
    
    const container = e.currentTarget.closest('.flex-1') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const mouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
    const dragOffset = {
      x: mouseWorldPos.x - node.position.x,
      y: mouseWorldPos.y - node.position.y
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const currentMouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
      
      const newPosition = {
        x: currentMouseWorldPos.x - dragOffset.x,
        y: currentMouseWorldPos.y - dragOffset.y
      };

      onNodeDrag(node.id, newPosition);
    };

    const handleMouseUp = () => {
      setDraggedNode(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [screenToWorld, setDraggedNode, onNodeDrag, connectionCreationState.isCreating]);

  return (
    <>
      {nodes.map((node) => (
        <StorylineNode
          key={node.id}
          node={node}
          isDragged={draggedNode === node.id}
          isConnectionSource={connectionCreationState.sourceNodeId === node.id}
          onEdit={onNodeEdit}
          onDelete={onNodeDelete}
          onDragStart={handleNodeDragStart}
          onConnectionStart={onConnectionStart}
          onConnectionFinish={onConnectionFinish}
        />
      ))}
    </>
  );
};

export default StorylineNodesLayer;
