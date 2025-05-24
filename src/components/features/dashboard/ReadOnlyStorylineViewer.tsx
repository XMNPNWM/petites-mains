
import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

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

interface ReadOnlyStorylineViewerProps {
  projectId: string;
}

const ReadOnlyStorylineViewer = ({ projectId }: ReadOnlyStorylineViewerProps) => {
  const [nodes, setNodes] = useState<StorylineNode[]>([]);
  const [connections, setConnections] = useState<StorylineConnection[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchStorylineData();
  }, [projectId]);

  const fetchStorylineData = async () => {
    try {
      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('storyline_nodes')
        .select('*')
        .eq('project_id', projectId);

      if (nodesError) throw nodesError;
      
      // Transform the data to match our interface
      const transformedNodes: StorylineNode[] = (nodesData || []).map(node => ({
        id: node.id,
        title: node.title,
        content: node.content || '',
        node_type: node.node_type,
        position: typeof node.position === 'object' && node.position !== null
          ? node.position as { x: number; y: number }
          : { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
      }));
      
      setNodes(transformedNodes);

      // Fetch connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('storyline_connections')
        .select('*')
        .eq('project_id', projectId);

      if (connectionsError) throw connectionsError;
      setConnections(connectionsData || []);
    } catch (error) {
      console.error('Error fetching storyline data:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900 text-sm">Storyline Map</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <p className="text-slate-500 text-center py-8">No storyline nodes created yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Compact Header - matching StorylinePanel */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 text-sm">Storyline Map</h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0 text-xs"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-xs text-slate-500 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0 text-xs"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Canvas - matching StorylinePanel exactly */}
      <div className="flex-1 relative overflow-hidden bg-slate-50">
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Grid Pattern - matching StorylinePanel */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Connections - matching StorylinePanel */}
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

          {/* Nodes - matching StorylinePanel exactly */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute pointer-events-none"
              style={{
                left: node.position.x,
                top: node.position.y
              }}
            >
              <Card className="w-28 hover:shadow-lg transition-shadow">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-xs font-medium text-slate-900 line-clamp-2">
                      {node.title}
                    </h4>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                    {node.node_type}
                  </span>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyStorylineViewer;
