
import React, { useCallback, useState } from 'react';
import StorylineNode from './StorylineNode';
import StorylineContextMenu from './StorylineContextMenu';
import ConnectionLabelForm from './ConnectionLabelForm';
import { StorylineNode as StorylineNodeType, StorylineConnection, WorldbuildingElement, ConnectionLabelState } from './types';

interface StorylineCanvasProps {
  nodes: StorylineNodeType[];
  connections: StorylineConnection[];
  worldbuildingElements: WorldbuildingElement[];
  zoom: number;
  pan: { x: number; y: number };
  draggedNode: string | null;
  connectionLabelState: ConnectionLabelState;
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
  setDraggedNode
}: StorylineCanvasProps) => {
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number } | null>(null);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get the container element to calculate proper bounds
    const container = e.currentTarget.closest('.flex-1') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    // Convert to world coordinates for node placement
    const worldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
    setContextPosition(worldPos);
  }, [screenToWorld]);

  const handleCreateNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    onCreateNode(nodeType, position);
    setContextPosition(null);
  }, [onCreateNode]);

  const handleCreateFromWorldbuilding = useCallback((element: WorldbuildingElement, position: { x: number; y: number }) => {
    onCreateFromWorldbuilding(element, position);
    setContextPosition(null);
  }, [onCreateFromWorldbuilding]);

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
  }, [screenToWorld, setDraggedNode, onNodeDrag, pan, zoom]);

  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    
    // Get screen coordinates for the form position
    const container = e.currentTarget.closest('.flex-1') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const screenPosition = {
      x: (e.clientX - containerRect.left),
      y: (e.clientY - containerRect.top)
    };
    
    onConnectionLabelEdit(connectionId, screenPosition);
  }, [onConnectionLabelEdit]);

  return (
    <StorylineContextMenu
      worldbuildingElements={worldbuildingElements}
      onCreateNode={handleCreateNode}
      onCreateFromWorldbuilding={handleCreateFromWorldbuilding}
      contextPosition={contextPosition}
    >
      <div 
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing select-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        onWheel={onWheel}
        onContextMenu={handleContextMenu}
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
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <StorylineNode
              key={node.id}
              node={node}
              isDragged={draggedNode === node.id}
              onEdit={onNodeEdit}
              onDelete={onNodeDelete}
              onDragStart={handleNodeDragStart}
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
      </div>
    </StorylineContextMenu>
  );
};

export default StorylineCanvas;
