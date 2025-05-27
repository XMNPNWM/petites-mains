
import React from 'react';
import StorylineNode from '../StorylineNode';
import { StorylineNode as StorylineNodeType } from '../types';

interface NodesLayerProps {
  nodes: StorylineNodeType[];
  zoom: number;
  pan: { x: number; y: number };
  draggedNode: string | null;
  selectedNode: string | null;
  connectionSourceNodeId: string | null;
  onNodeEdit: (node: StorylineNodeType) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
  setDraggedNode: (nodeId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

const NodesLayer = React.memo(({
  nodes,
  zoom,
  pan,
  draggedNode,
  selectedNode,
  connectionSourceNodeId,
  onNodeEdit,
  onNodeDelete,
  onNodeDrag,
  onConnectionStart,
  onConnectionFinish,
  setDraggedNode,
  setSelectedNode
}: NodesLayerProps) => {
  const handleNodeClick = (e: React.MouseEvent, node: StorylineNodeType) => {
    e.stopPropagation();
    console.log(`[NodesLayer] Node ${node.id} clicked, setting as selected`);
    setSelectedNode(node.id);
  };

  return (
    <div
      className="absolute inset-0 select-none"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        userSelect: 'none',
        zIndex: 2
      }}
    >
      {nodes.map((node) => (
        <div
          key={node.id}
          onClick={(e) => handleNodeClick(e, node)}
          className="relative"
          style={{
            position: 'absolute',
            left: node.position.x,
            top: node.position.y,
            cursor: draggedNode === node.id ? 'grabbing' : 'pointer'
          }}
        >
          <StorylineNode
            node={node}
            zoom={zoom}
            pan={pan}
            isDragged={draggedNode === node.id}
            isSelected={selectedNode === node.id}
            isConnectionSource={connectionSourceNodeId === node.id}
            onEdit={onNodeEdit}
            onDelete={onNodeDelete}
            onDrag={onNodeDrag}
            onConnectionStart={onConnectionStart}
            onConnectionFinish={onConnectionFinish}
            setDraggedNode={setDraggedNode}
            setSelectedNode={setSelectedNode}
          />
          
          {/* Selection overlay for better visual feedback */}
          {selectedNode === node.id && (
            <div
              className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
              style={{
                transform: 'translate(-2px, -2px)',
                width: 'calc(100% + 4px)',
                height: 'calc(100% + 4px)',
                boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)',
                zIndex: -1
              }}
            />
          )}
          
          {/* Connection source indicator */}
          {connectionSourceNodeId === node.id && (
            <div
              className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none animate-pulse"
              style={{
                transform: 'translate(-2px, -2px)',
                width: 'calc(100% + 4px)',
                height: 'calc(100% + 4px)',
                boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.3)',
                zIndex: -1
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

NodesLayer.displayName = 'NodesLayer';

export default NodesLayer;
