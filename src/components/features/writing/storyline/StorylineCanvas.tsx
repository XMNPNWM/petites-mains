
import React, { useCallback } from 'react';
import StorylineContextMenu from './StorylineContextMenu';
import StorylineCanvasContainer from './StorylineCanvasContainer';
import StorylineSVGLayer from './StorylineSVGLayer';
import StorylineNodesLayer from './StorylineNodesLayer';
import StorylineUIOverlay from './StorylineUIOverlay';
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
}

const StorylineCanvas = ({
  nodes,
  connections,
  worldbuildingElements,
  zoom,
  pan,
  draggedNode,
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
  setDraggedNode
}: StorylineCanvasProps) => {
  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleCreateNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    onCreateNode(nodeType, position);
  }, [onCreateNode]);

  const handleCreateFromWorldbuilding = useCallback((element: WorldbuildingElement, position: { x: number; y: number }) => {
    onCreateFromWorldbuilding(element, position);
  }, [onCreateFromWorldbuilding]);

  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    
    const container = e.currentTarget.closest('.flex-1') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const screenPosition = {
      x: (e.clientX - containerRect.left),
      y: (e.clientY - containerRect.top)
    };
    
    onConnectionLabelEdit(connectionId, screenPosition);
  }, [onConnectionLabelEdit]);

  const handleContextMenuTrigger = useCallback((position: { x: number; y: number }) => {
    const worldPos = screenToWorld(position.x, position.y);
    return worldPos;
  }, [screenToWorld]);

  return (
    <StorylineContextMenu
      worldbuildingElements={worldbuildingElements}
      onCreateNode={handleCreateNode}
      onCreateFromWorldbuilding={handleCreateFromWorldbuilding}
      onContextMenuTrigger={handleContextMenuTrigger}
    >
      <StorylineCanvasContainer
        zoom={zoom}
        pan={pan}
        connectionCreationState={connectionCreationState}
        onCanvasMouseDown={onCanvasMouseDown}
        onCanvasMouseMove={onCanvasMouseMove}
        onCanvasMouseUp={onCanvasMouseUp}
        onWheel={onWheel}
        onConnectionCancel={onConnectionCancel}
        onConnectionPreviewUpdate={onConnectionPreviewUpdate}
      >
        <StorylineSVGLayer
          nodes={nodes}
          connections={connections}
          connectionCreationState={connectionCreationState}
          onConnectionClick={handleConnectionClick}
        />

        <StorylineNodesLayer
          nodes={nodes}
          draggedNode={draggedNode}
          connectionCreationState={connectionCreationState}
          zoom={zoom}
          pan={pan}
          onNodeEdit={onNodeEdit}
          onNodeDelete={onNodeDelete}
          onNodeDrag={onNodeDrag}
          onConnectionStart={onConnectionStart}
          onConnectionFinish={onConnectionFinish}
          setDraggedNode={setDraggedNode}
        />
      </StorylineCanvasContainer>

      <StorylineUIOverlay
        connections={connections}
        connectionLabelState={connectionLabelState}
        connectionCreationState={connectionCreationState}
        onConnectionLabelSave={onConnectionLabelSave}
        onConnectionLabelCancel={onConnectionLabelCancel}
      />
    </StorylineContextMenu>
  );
};

export default StorylineCanvas;
