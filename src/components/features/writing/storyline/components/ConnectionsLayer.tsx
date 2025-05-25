
import React from 'react';
import { StorylineNode, StorylineConnection } from '../types';
import { NODE_DIMENSIONS } from '../constants/nodeConstants';

interface ConnectionsLayerProps {
  nodes: StorylineNode[];
  connections: StorylineConnection[];
  connectionCreationState: {
    isCreating: boolean;
    previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  };
  onConnectionClick: (e: React.MouseEvent, connectionId: string) => void;
}

const ConnectionsLayer = React.memo(({
  nodes,
  connections,
  connectionCreationState,
  onConnectionClick
}: ConnectionsLayerProps) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '5000px', minHeight: '5000px' }}>
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
              strokeWidth="2"
              strokeDasharray="5,5"
              className="pointer-events-auto cursor-pointer hover:stroke-slate-500"
              onClick={(e) => onConnectionClick(e, connection.id)}
            />
            {connection.label && (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                className="fill-slate-600 text-xs pointer-events-auto cursor-pointer"
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
          strokeWidth="2"
          strokeDasharray="3,3"
          className="pointer-events-none"
        />
      )}
    </svg>
  );
});

ConnectionsLayer.displayName = 'ConnectionsLayer';

export default ConnectionsLayer;
