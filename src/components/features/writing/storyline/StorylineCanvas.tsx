
import React, { useCallback } from 'react';
import StorylineContextMenu from './StorylineContextMenu';
import CanvasBackground from './components/CanvasBackground';
import ConnectionsLayer from './components/ConnectionsLayer';
import NodesLayer from './components/NodesLayer';
import CanvasOverlays from './components/CanvasOverlays';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { StorylineNode as StorylineNodeType, StorylineConnection, WorldbuildingElement, ConnectionLabelState } from './types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

interface StorylineCanvasProps {
  nodes: StorylineNodeType[];
  connections: StorylineConnection[];
  worldbuildingElements: WorldbuildingElement[];
  zoom: number;
  pan: { x: number; y: number };
  draggedNode: string | null;
  selectedNode: string | null;
  connectionLabelState: ConnectionLabelState;
  connectionCreationState: ConnectionCreationState;
  onNodeEdit: (node: StorylineNodeType) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onCreateNode: (nodeType: string, position: { x: number; y: number }) => void;
  onCreateFromWorldbuilding: (element: WorldbuildingElement, position: { x: number; y: number }) => void;
  onConnectionLabelEdit: (connectionId: string, position: { x: number; y: number }) => void;
  onConnectionLabelSave: (connectionId: string, label: string) => void;
  onConnectionLabelCancel: () => void;
  onConnectionStart: (sourceNodeId: string, sourcePosition: { x: number; y: number }) => void;
  onConnectionPreviewUpdate: (mousePosition: { x: number; y: number }) => void;
  onConnectionFinish: (targetNodeId: string) => void;
  onConnectionCancel: () => void;
  setDraggedNode: (nodeId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

const StorylineCanvas = React.memo(({
  nodes,
  connections,
  worldbuildingElements,
  zoom,
  pan,
  draggedNode,
  selectedNode,
  connectionLabelState,
  connectionCreationState,
  onNodeEdit,
  onNodeDelete,
  onNodeDrag,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onWheel,
  onCreateNode,
  onCreateFromWorldbuilding,
  onConnectionLabelEdit,
  onConnectionLabelSave,
  onConnectionLabelCancel,
  onConnectionStart,
  onConnectionPreviewUpdate,
  onConnectionFinish,
  onConnectionCancel,
  setDraggedNode,
  setSelectedNode
}: StorylineCanvasProps) => {
  const { handleMouseDown, handleMouseMove, screenToWorld } = useCanvasInteractions({
    zoom,
    pan,
    connectionCreationState,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onConnectionPreviewUpdate,
    onConnectionCancel
  });

  const handleCreateNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    const worldPos = screenToWorld(position.x, position.y);
    onCreateNode(nodeType, worldPos);
  }, [onCreateNode, screenToWorld]);

  const handleCreateFromWorldbuilding = useCallback((element: WorldbuildingElement, position: { x: number; y: number }) => {
    const worldPos = screenToWorld(position.x, position.y);
    onCreateFromWorldbuilding(element, worldPos);
  }, [onCreateFromWorldbuilding, screenToWorld]);

  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    
    const canvas = e.currentTarget.closest('div[style*="background"]') as HTMLElement;
    const canvasRect = canvas.getBoundingClientRect();
    
    const screenPosition = {
      x: (e.clientX - canvasRect.left),
      y: (e.clientY - canvasRect.top)
    };
    
    onConnectionLabelEdit(connectionId, screenPosition);
  }, [onConnectionLabelEdit]);

  const handleContextMenuTrigger = useCallback((position: { x: number; y: number }) => {
    return position;
  }, []);

  const canvasContent = (
    <CanvasBackground
      zoom={zoom}
      pan={pan}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={onCanvasMouseUp}
      onWheel={onWheel}
    >
      {/* Connections Layer - positioned absolutely to avoid clipping */}
      <ConnectionsLayer
        nodes={nodes}
        connections={connections}
        zoom={zoom}
        pan={pan}
        connectionCreationState={connectionCreationState}
        onConnectionClick={handleConnectionClick}
      />

      {/* Nodes Layer - in transformed container */}
      <div
        className="absolute inset-0 select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          userSelect: 'none',
          zIndex: 2
        }}
      >
        <NodesLayer
          nodes={nodes}
          zoom={zoom}
          pan={pan}
          draggedNode={draggedNode}
          selectedNode={selectedNode}
          connectionSourceNodeId={connectionCreationState.sourceNodeId}
          onNodeEdit={onNodeEdit}
          onNodeDelete={onNodeDelete}
          onNodeDrag={onNodeDrag}
          onConnectionStart={onConnectionStart}
          onConnectionFinish={onConnectionFinish}
          setDraggedNode={setDraggedNode}
          setSelectedNode={setSelectedNode}
        />
      </div>

      {/* Overlays - positioned at canvas level */}
      <CanvasOverlays
        connectionLabelState={connectionLabelState}
        connectionCreationState={connectionCreationState}
        connections={connections}
        onConnectionLabelSave={onConnectionLabelSave}
        onConnectionLabelCancel={onConnectionLabelCancel}
      />
    </CanvasBackground>
  );

  return (
    <StorylineContextMenu
      worldbuildingElements={worldbuildingElements}
      onCreateNode={handleCreateNode}
      onCreateFromWorldbuilding={handleCreateFromWorldbuilding}
      onContextMenuTrigger={handleContextMenuTrigger}
    >
      {canvasContent}
    </StorylineContextMenu>
  );
});

StorylineCanvas.displayName = 'StorylineCanvas';

export default StorylineCanvas;
