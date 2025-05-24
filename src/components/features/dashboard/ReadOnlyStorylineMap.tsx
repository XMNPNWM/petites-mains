
import React, { useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

interface ReadOnlyStorylineMapProps {
  nodes: StorylineNode[];
  connections: StorylineConnection[];
}

const ReadOnlyStorylineMap = ({ nodes, connections }: ReadOnlyStorylineMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'scene': return 'from-blue-500 to-blue-600';
      case 'character': return 'from-green-500 to-green-600';
      case 'plot': return 'from-purple-500 to-purple-600';
      case 'conflict': return 'from-red-500 to-red-600';
      case 'resolution': return 'from-amber-500 to-amber-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
            <Move className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No storyline nodes yet</p>
          <p className="text-slate-400 text-sm">Create nodes in the writing space to see your story map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
        <h3 className="font-semibold text-slate-900">Story Map</h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-500 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Canvas */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Grid Pattern */}
            <defs>
              <pattern id="read-only-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#read-only-grid)" />
            
            {/* Connections */}
            {connections.map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source_id);
              const targetNode = nodes.find(n => n.id === connection.target_id);
              if (!sourceNode || !targetNode) return null;
              
              return (
                <line
                  key={connection.id}
                  x1={sourceNode.position.x + 60}
                  y1={sourceNode.position.y + 30}
                  x2={targetNode.position.x + 60}
                  y2={targetNode.position.y + 30}
                  stroke="rgba(148, 163, 184, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute pointer-events-none"
              style={{
                left: node.position.x,
                top: node.position.y
              }}
            >
              <Card className="w-32 shadow-md">
                <CardContent className="p-3">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                      {node.title}
                    </h4>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getNodeTypeColor(node.node_type)} text-white`}>
                      {node.node_type}
                    </span>
                  </div>
                  {node.content && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {node.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="p-2 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          Drag to pan • Use zoom controls to explore your story structure
        </p>
      </div>
    </div>
  );
};

export default ReadOnlyStorylineMap;
