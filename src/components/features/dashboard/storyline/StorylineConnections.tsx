
import React from 'react';
import { getNodeTypeColor } from '@/components/features/writing/storyline/constants/nodeConstants';

interface StorylineNode {
  id: string;
  title: string;
  content: string;
  node_type: string;
  position: { x: number; y: number };
}

interface StorylineConnection {
  id: string;
  source_id: string;
  target_id: string;
  label: string;
}

interface StorylineConnectionsProps {
  connections: StorylineConnection[];
  nodes: StorylineNode[];
}

const StorylineConnections = ({ connections, nodes }: StorylineConnectionsProps) => {
  return (
    <g>
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source_id);
        const targetNode = nodes.find(n => n.id === connection.target_id);
        if (!sourceNode || !targetNode) return null;
        
        const sourceColor = getNodeTypeColor(sourceNode.node_type);
        const targetColor = getNodeTypeColor(targetNode.node_type);
        
        return (
          <g key={connection.id}>
            <defs>
              <linearGradient id={`gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: `rgb(${sourceColor.rgb})`, stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: `rgb(${targetColor.rgb})`, stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
            <line
              x1={sourceNode.position.x + 70}
              y1={sourceNode.position.y + 40}
              x2={targetNode.position.x + 70}
              y2={targetNode.position.y + 40}
              stroke={`url(#gradient-${connection.id})`}
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {connection.label && (
              <text
                x={(sourceNode.position.x + targetNode.position.x + 140) / 2}
                y={(sourceNode.position.y + targetNode.position.y + 80) / 2}
                textAnchor="middle"
                fontSize="12"
                className="fill-slate-600"
              >
                {connection.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default StorylineConnections;
