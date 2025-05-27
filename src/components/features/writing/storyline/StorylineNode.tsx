
import React from 'react';
import { StorylineNode as StorylineNodeType } from './types';
import NodeCard from './components/NodeCard';
import NodeVisualState from './components/NodeVisualState';
import NodeActionButtons from './components/NodeActionButtons';
import ConnectionCircles from './components/ConnectionCircles';
import { useNodeConnectionHandlers } from './components/NodeConnectionHandlers';

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
  const {
    handleNodeMouseDown,
    handleNodeMouseUp,
    handleConnectionCircleClick
  } = useNodeConnectionHandlers({
    nodeId: node.id,
    nodePosition: node.position,
    zoom,
    pan,
    isConnectionSource,
    onDrag,
    onConnectionStart,
    onConnectionFinish,
    setDraggedNode,
    setSelectedNode
  });

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`[StorylineNode] Node ${node.id} clicked directly`);
    setSelectedNode(node.id);
  };

  return (
    <NodeVisualState
      isConnectionSource={isConnectionSource}
      isSelected={isSelected}
      isDragged={isDragged}
      position={node.position}
      onMouseDown={handleNodeMouseDown}
      onMouseUp={handleNodeMouseUp}
      onClick={handleNodeClick}
    >
      <NodeCard
        node={node}
        isSelected={isSelected}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <ConnectionCircles onCircleClick={handleConnectionCircleClick} />
      
      {/* Enhanced hover area for better selection */}
      <div
        className="absolute inset-0 hover:bg-blue-50 hover:bg-opacity-20 transition-colors rounded-lg"
        style={{
          zIndex: 10,
          cursor: isDragged ? 'grabbing' : 'grab'
        }}
        onClick={handleNodeClick}
      />
    </NodeVisualState>
  );
});

StorylineNode.displayName = 'StorylineNode';

export default StorylineNode;
