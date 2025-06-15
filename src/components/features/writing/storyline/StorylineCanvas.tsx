
import React, { useCallback, useEffect } from 'react';
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
  worldbuildingElements?: WorldbuildingElement[];
  zoom: number;
  pan: { x: number; y: number };
  draggedNode?: string | null;
  selectedNode?: string | null;
  connectionLabelState?: ConnectionLabelState;
  connectionCreationState?: ConnectionCreationState;
  readOnly?: boolean;
  onNodeEdit?: (node: StorylineNodeType) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeDrag?: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onCanvasMouseDown?: (e: React.MouseEvent) => void;
  onCanvasMouseMove?: (e: React.MouseEvent) => void;
  onCanvasMouseUp?: () => void;
  onWheel?: (e: React.WheelEvent) => void;
  onCreateNode?: (nodeType: string, position: { x: number; y: number }) => void;
  onCreateFromWorldbuilding?: (element: WorldbuildingElement, position: { x: number; y: number }) => void;
  onConnectionLabelEdit?: (connectionId: string, position: { x: number; y: number }) => void;
  onConnectionLabelSave?: (connectionId: string, label: string) => void;
  onConnectionLabelDelete?: (connectionId: string) => void;
  onConnectionLabelCancel?: () => void;
  onConnectionStart?: (sourceNodeId: string, sourcePosition: { x: number; y: number }) => void;
  onConnectionPreviewUpdate?: (mousePosition: { x: number; y: number }) => void;
  onConnectionFinish?: (targetNodeId: string) => void;
  onConnectionCancel?: () => void;
  setDraggedNode?: (nodeId: string | null) => void;
  setSelectedNode?: (nodeId: string | null) => void;
  // Navigation props
  onNavigateToNode?: (nodeId: string, position: { x: number; y: number }) => void;
  // Read-only specific props
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
}

const StorylineCanvas = React.memo(({
  nodes,
  connections,
  worldbuildingElements = [],
  zoom,
  pan,
  draggedNode = null,
  selectedNode = null,
  connectionLabelState = { isEditing: false, connectionId: null, position: null },
  connectionCreationState = { isCreating: false, sourceNodeId: null, previewConnection: null },
  readOnly = false,
  onNodeEdit = () => {},
  onNodeDelete = () => {},
  onNodeDrag = () => {},
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onWheel,
  onCreateNode = () => {},
  onCreateFromWorldbuilding = () => {},
  onConnectionLabelEdit = () => {},
  onConnectionLabelSave = () => {},
  onConnectionLabelDelete = () => {},
  onConnectionLabelCancel = () => {},
  onConnectionStart = () => {},
  onConnectionPreviewUpdate = () => {},
  onConnectionFinish = () => {},
  onConnectionCancel = () => {},
  setDraggedNode = () => {},
  setSelectedNode = () => {},
  onNavigateToNode,
  // Read-only specific handlers
  onMouseDown,
  onMouseMove,
  onMouseUp
}: StorylineCanvasProps) => {
  const { handleMouseDown, handleMouseMove, screenToWorld } = useCanvasInteractions({
    zoom,
    pan,
    connectionCreationState,
    onCanvasMouseDown: onCanvasMouseDown || onMouseDown || (() => {}),
    onCanvasMouseMove: onCanvasMouseMove || onMouseMove || (() => {}),
    onCanvasMouseUp: onCanvasMouseUp || onMouseUp || (() => {}),
    onConnectionPreviewUpdate,
    onConnectionCancel
  });

  // Listen for navigation events from worldbuilding elements
  useEffect(() => {
    const handleNavigationEvent = (event: CustomEvent) => {
      const { nodeId, position, elementName } = event.detail;
      console.log('StorylineCanvas: Received navigation event:', { nodeId, position, elementName });
      
      if (onNavigateToNode) {
        onNavigateToNode(nodeId, position);
      }
    };

    window.addEventListener('navigateToStorylineNode', handleNavigationEvent as EventListener);
    
    return () => {
      window.removeEventListener('navigateToStorylineNode', handleNavigationEvent as EventListener);
    };
  }, [onNavigateToNode]);

  const handleCreateNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    if (readOnly) return;
    const worldPos = screenToWorld(position.x, position.y);
    onCreateNode(nodeType, worldPos);
  }, [onCreateNode, screenToWorld, readOnly]);

  const handleCreateFromWorldbuilding = useCallback((element: WorldbuildingElement, position: { x: number; y: number }) => {
    if (readOnly) return;
    const worldPos = screenToWorld(position.x, position.y);
    onCreateFromWorldbuilding(element, worldPos);
  }, [onCreateFromWorldbuilding, screenToWorld, readOnly]);

  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    
    const canvas = e.currentTarget.closest('[data-storyline-canvas]') as HTMLElement;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    
    const screenPosition = {
      x: (e.clientX - canvasRect.left),
      y: (e.clientY - canvasRect.top)
    };
    
    onConnectionLabelEdit(connectionId, screenPosition);
  }, [onConnectionLabelEdit, readOnly]);

  const handleContextMenuTrigger = useCallback((position: { x: number; y: number }) => {
    return position;
  }, []);

  const canvasContent = (
    <CanvasBackground
      zoom={zoom}
      pan={pan}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={onCanvasMouseUp || onMouseUp || (() => {})}
      onWheel={onWheel || (() => {})}
    >
      {/* Connections Layer - positioned absolutely */}
      <ConnectionsLayer
        nodes={nodes}
        connections={connections}
        zoom={zoom}
        pan={pan}
        connectionCreationState={connectionCreationState}
        onConnectionClick={handleConnectionClick}
      />

      {/* Nodes Layer - directly positioned in world coordinates */}
      <NodesLayer
        nodes={nodes}
        zoom={zoom}
        pan={pan}
        draggedNode={draggedNode}
        selectedNode={selectedNode}
        connectionSourceNodeId={connectionCreationState.sourceNodeId}
        onNodeEdit={readOnly ? () => {} : onNodeEdit}
        onNodeDelete={readOnly ? () => {} : onNodeDelete}
        onNodeDrag={readOnly ? () => {} : onNodeDrag}
        onConnectionStart={readOnly ? () => {} : onConnectionStart}
        onConnectionFinish={readOnly ? () => {} : onConnectionFinish}
        setDraggedNode={readOnly ? () => {} : setDraggedNode}
        setSelectedNode={readOnly ? () => {} : setSelectedNode}
      />

      {/* Overlays - positioned at canvas level - only show in edit mode */}
      {!readOnly && (
        <CanvasOverlays
          connectionLabelState={connectionLabelState}
          connectionCreationState={connectionCreationState}
          connections={connections}
          onConnectionLabelSave={onConnectionLabelSave}
          onConnectionLabelDelete={onConnectionLabelDelete}
          onConnectionLabelCancel={onConnectionLabelCancel}
        />
      )}
    </CanvasBackground>
  );

  // In read-only mode, skip context menu
  if (readOnly) {
    return canvasContent;
  }

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
