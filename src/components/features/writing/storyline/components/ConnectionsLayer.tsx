
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
  // Calculate minimum hit-box width that doesn't get too small when zoomed out
  const getHitBoxWidth = () => {
    const baseWidth = 12; // Base hit-box width in pixels
    const minWidth = 8; // Minimum width when zoomed out
    return Math.max(baseWidth / zoom, minWidth);
  };

  const getVisibleStrokeWidth = () => {
    return Math.max(2 / zoom, 1);
  };

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
        
        const hitBoxWidth = getHitBoxWidth();
        const visibleStrokeWidth = getVisibleStrokeWidth();
        
        return (
          <g key={connection.id}>
            {/* Invisible thick line for hit-box */}
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="transparent"
              strokeWidth={hitBoxWidth}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => onConnectionClick(e, connection.id)}
            />
            
            {/* Visible connection line */}
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="rgba(148, 163, 184, 0.6)"
              strokeWidth={visibleStrokeWidth}
              strokeDasharray={`${5 / zoom},${5 / zoom}`}
              className="pointer-events-none hover:stroke-slate-500 transition-colors"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}
            />
            
            {/* Connection label with improved positioning */}
            {connection.label && (
              <g>
                {/* Label background for better readability */}
                <rect
                  x={midX - (connection.label.length * 3) / zoom}
                  y={midY - 8 / zoom}
                  width={(connection.label.length * 6) / zoom}
                  height={16 / zoom}
                  fill="rgba(255, 255, 255, 0.9)"
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeWidth={1 / zoom}
                  rx={2 / zoom}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => onConnectionClick(e, connection.id)}
                />
                
                {/* Label text */}
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(12 / zoom, 10)}
                  className="fill-slate-700 pointer-events-auto cursor-pointer font-medium"
                  onClick={(e) => onConnectionClick(e, connection.id)}
                >
                  {connection.label}
                </text>
              </g>
            )}
            
            {/* Hover indicator circle at midpoint */}
            <circle
              cx={midX}
              cy={midY}
              r={4 / zoom}
              fill="rgba(59, 130, 246, 0.7)"
              className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
              onClick={(e) => onConnectionClick(e, connection.id)}
            />
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
          strokeWidth={Math.max(2 / zoom, 1)}
          strokeDasharray={`${3 / zoom},${3 / zoom}`}
          className="pointer-events-none"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
          }}
        />
      )}
    </svg>
  );
});

ConnectionsLayer.displayName = 'ConnectionsLayer';

export default ConnectionsLayer;
