
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getNodeTypeColor } from '@/components/features/writing/storyline/constants/nodeConstants';
import { getNodeTypeDisplayName } from '@/components/features/writing/storyline/utils/nodeTypeUtils';

interface StorylineNode {
  id: string;
  title: string;
  content: string;
  node_type: string;
  position: { x: number; y: number };
}

interface StorylineNodesProps {
  nodes: StorylineNode[];
}

const StorylineNodes = ({ nodes }: StorylineNodesProps) => {
  return (
    <>
      {nodes.map((node) => {
        const nodeTypeColor = getNodeTypeColor(node.node_type);
        const displayName = getNodeTypeDisplayName(node.node_type);
        
        return (
          <div
            key={node.id}
            className="absolute pointer-events-none"
            style={{
              left: node.position.x,
              top: node.position.y
            }}
          >
            <Card className={`w-36 h-32 shadow-md transition-all duration-200 border-2 ${nodeTypeColor.border}`}>
              <CardContent className="p-3 h-full flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                    {node.title}
                  </h4>
                </div>
                
                <div className="flex-1 mb-2">
                  {node.content && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {node.content}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `rgba(${nodeTypeColor.rgb}, 0.1)`,
                      color: `rgb(${nodeTypeColor.rgb})`
                    }}
                  >
                    {displayName}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </>
  );
};

export default StorylineNodes;
