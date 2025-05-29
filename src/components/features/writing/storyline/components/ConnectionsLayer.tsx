
import React from 'react';
import { StorylineNode, StorylineConnection } from '../types';
import { NODE_DIMENSIONS, getNodeTypeRgb, createGradientId } from '../constants/nodeConstants';

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
  const handleConnectionClick = (e: React.MouseEvent, connectionId: string) => {
    // Don't handle clicks on preview connections
    if (connectionId === 'preview-connection') {
      console.log('Ignoring click on preview connection');
      return;
    }
    
    console.log('Connection clicked:', connectionId);
    onConnectionClick(e, connectionId);
  };

  // Generate all possible gradient definitions
  const generateGradientDefinitions = () => {
    const gradients: JSX.Element[] = [];
    const nodeTypes = ['scene', 'character', 'location', 'lore', 'event', 'organization', 'religion', 'politics', 'artifact'];
    
    nodeTypes.forEach(sourceType => {
      nodeTypes.forEach(targetType => {
        const sourceRgb = getNodeTypeRgb(sourceType);
        const targetRgb = getNodeTypeRgb(targetType);
        const gradientId = createGradientId(sourceType, targetType);
        
        gradients.push(
          <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: `rgb(${sourceRgb})`, stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: `rgb(${targetRgb})`, stopOpacity: 0.15 }} />
          </linearGradient>
        );
      });
    });
    
    return gradients;
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
        zIndex: 3
      }}
      viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${window.innerWidth / zoom} ${window.innerHeight / zoom}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {generateGradientDefinitions()}
      </defs>

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
        
        // Calculate hit-box width that scales with zoom but maintains minimum size
        const hitBoxWidth = Math.max(20 / zoom, 6);
        
        // Get gradient ID for this connection
        const gradientId = createGradientId(sourceNode.node_type, targetNode.node_type);
        
        return (
          <g key={connection.id}>
            {/* Invisible hit-box line - much thicker for easier clicking */}
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="transparent"
              strokeWidth={hitBoxWidth}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => handleConnectionClick(e, connection.id)}
            />
            {/* Visible connection line with gradient */}
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke={`url(#${gradientId})`}
              strokeWidth={2 / zoom}
              strokeDasharray={`${5 / zoom},${5 / zoom}`}
              className="pointer-events-none"
            />
            {connection.label && (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                fontSize={12 / zoom}
                className="fill-slate-600 pointer-events-auto cursor-pointer"
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
        <g>
          {/* Visible preview connection line - no click handler for preview */}
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
        </g>
      )}
    </svg>
  );
});

ConnectionsLayer.displayName = 'ConnectionsLayer';

export default ConnectionsLayer;
