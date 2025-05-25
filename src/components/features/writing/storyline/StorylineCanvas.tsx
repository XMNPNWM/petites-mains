
import React, { useCallback, useState } from 'react';
import StorylineNode from './StorylineNode';
import StorylineContextMenu from './StorylineContextMenu';
import ConnectionLabelForm from './ConnectionLabelForm';
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Skip handling for right-click (context menu)
    if (e.button === 2) {
      return;
    }
    
    // Cancel connection creation if clicking on empty canvas
    if (connectionCreationState.isCreating) {
      onConnectionCancel();
      return;
    }
    
    // Only handle left-click for panning
    if (e.button === 0) {
      onCanvasMouseDown(e);
    }
  }, [onCanvasMouseDown, connectionCreationState.isCreating, onConnectionCancel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update connection preview if creating connection
    if (connectionCreationState.isCreating) {
      const container = e.currentTarget.closest('.flex-1') as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const mouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
      onConnectionPreviewUpdate(mouseWorldPos);
    }
    
    onCanvasMouseMove(e);
  }, [onCanvasMouseMove, connectionCreationState.isCreating, onConnectionPreviewUpdate, screenToWorld]);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, node: StorylineNodeType) => {
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
  }, [screenToWorld, setDraggedNode, onNodeDrag]);

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
      <div 
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing select-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        onWheel={onWheel}
        unselectable="on"
      >
        <div
          className="absolute inset-0 select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            userSelect: 'none'
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Connections */}
            {connections.map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source_id);
              const targetNode = nodes.find(n => n.id === connection.target_id);
              if (!sourceNode || !targetNode) return null;
              
              const midX = (sourceNode.position.x + targetNode.position.x + 120) / 2;
              const midY = (sourceNode.position.y + targetNode.position.y + 60) / 2;
              
              return (
                <g key={connection.id}>
                  <line
                    x1={sourceNode.position.x + 60}
                    y1={sourceNode.position.y + 30}
                    x2={targetNode.position.x + 60}
                    y2={targetNode.position.y + 30}
                    stroke="rgba(148, 163, 184, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="pointer-events-auto cursor-pointer hover:stroke-slate-500"
                    onClick={(e) => handleConnectionClick(e, connection.id)}
                  />
                  {connection.label && (
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      className="fill-slate-600 text-xs pointer-events-auto cursor-pointer"
                      onClick={(e) => handleConnectionClick(e, connection.id)}
                    >
                      {connection.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Connection Preview */}
            {connectionCreationState.isCreating && connectionCreationState.previewConnection && (
              <line
                x1={connectionCreationState.previewConnection.start.x}
                y1={connectionCreationState.previewConnection.start.y}
                x2={connectionCreationState.previewConnection.end.x}
                y2={connectionCreationState.previewConnection.end.y}
                stroke="rgba(59, 130, 246, 0.8)"
                strokeWidth="2"
                strokeDasharray="3,3"
                className="pointer-events-none"
              />
            )}
          </svg>

          {/* Nodes */}
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
        </div>

        {/* Connection Label Form */}
        {connectionLabelState.isEditing && connectionLabelState.connectionId && connectionLabelState.position && (
          <ConnectionLabelForm
            connectionId={connectionLabelState.connectionId}
            currentLabel={connections.find(c => c.id === connectionLabelState.connectionId)?.label || ''}
            position={connectionLabelState.position}
            onSave={onConnectionLabelSave}
            onCancel={onConnectionLabelCancel}
          />
        )}

        {/* Connection Creation Instructions */}
        {connectionCreationState.isCreating && (
          <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 z-20">
            <p className="text-sm text-blue-800 font-medium">Creating Connection</p>
            <p className="text-xs text-blue-600">Click on a target node to connect, or click elsewhere to cancel</p>
          </div>
        )}
      </div>
    </StorylineContextMenu>
  );
};

export default StorylineCanvas;
