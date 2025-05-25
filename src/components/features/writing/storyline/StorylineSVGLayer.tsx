
import React from 'react';
import { StorylineNode as StorylineNodeType, StorylineConnection } from './types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

interface StorylineSVGLayerProps {
  nodes: StorylineNodeType[];
  connections: StorylineConnection[];
  connectionCreationState: ConnectionCreationState;
  onConnectionClick: (e: React.MouseEvent, connectionId: string) => void;
}

const StorylineSVGLayer = ({
  nodes,
  connections,
  connectionCreationState,
  onConnectionClick
}: StorylineSVGLayerProps) => {
  return (
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
        
        const sourceX = sourceNode.position.x + 56; // Center of node (112px / 2)
        const sourceY = sourceNode.position.y + 40; // Center height
        const targetX = targetNode.position.x + 56;
        const targetY = targetNode.position.y + 40;
        
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
};

export default StorylineSVGLayer;
