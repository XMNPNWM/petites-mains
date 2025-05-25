
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
  return (
    <>
      {nodes.map((node) => (
        <StorylineNode
          key={node.id}
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
      ))}
    </>
  );
});

NodesLayer.displayName = 'NodesLayer';

export default NodesLayer;
