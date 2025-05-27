
import React from 'react';
import { StorylineNode, StorylineConnection } from '../types';
import { NODE_DIMENSIONS } from '../constants/nodeConstants';

interface ConnectionsLayerProps {
  nodes: StorylineNode[];
  connections: StorylineConnection[];
  zoom: number;
  pan: { x: number; y: number };
  connectionCreationState: {
    isCreating: boolean;
    previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  };
  onConnectionClick: (e: React.MouseEvent, connectionId: string) => void;
}

const ConnectionsLayer = React.memo(({
  nodes,
  connections,
  zoom,
  pan,
  connectionCreationState,
  onConnectionClick
}: ConnectionsLayerProps) => {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      style={{ 
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
      }}
      viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${window.innerWidth / zoom} ${window.innerHeight / zoom}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Connections */}
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source_id);
        const targetNode = nodes.find(n => n.id === connection.target_id);
        if (!sourceNode || !targetNode) return null;
        
        const sourceX = sourceNode.position.x + NODE_DIMENSIONS.WIDTH / 2;
        const sourceY = sourceNode.position.y + NODE_DIMENSIONS.HEIGHT / 2;
        const targetX = targetNode.position.x + NODE_DIMENSIONS.WIDTH / 2;
        const targetY = targetNode.position.y + NODE_DIMENSIONS.HEIGHT / 2;
        
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        return (
          <g key={connection.id}>
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="rgba(148, 163, 184, 0.6)"
              strokeWidth={2 / zoom}
              strokeDasharray={`${5 / zoom},${5 / zoom}`}
              className="pointer-events-auto cursor-pointer hover:stroke-slate-500"
              onClick={(e) => onConnectionClick(e, connection.id)}
            />
            {connection.label && (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                fontSize={12 / zoom}
                className="fill-slate-600 pointer-events-auto cursor-pointer"
                onClick={(e) => onConnectionClick(e, connection.id)}
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
          strokeWidth={2 / zoom}
          strokeDasharray={`${3 / zoom},${3 / zoom}`}
          className="pointer-events-none"
        />
      )}
    </svg>
  );
});

ConnectionsLayer.displayName = 'ConnectionsLayer';

export default ConnectionsLayer;
