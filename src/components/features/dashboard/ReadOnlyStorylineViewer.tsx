
import React, { useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { normalizeNodeType, getNodeTypeDisplayName } from '../writing/storyline/utils/nodeTypeUtils';
import { getNodeTypeColor } from '../writing/storyline/constants/nodeConstants';

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

  const calculateViewportCenter = (nodesList: StorylineNode[]) => {
    if (nodesList.length === 0) return { x: 400, y: 300 };

    // Calculate bounding box of all nodes
    const positions = nodesList.map(node => node.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Calculate center point of all nodes
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Center the nodes in the viewport
    const viewportCenterX = 600;
    const viewportCenterY = 400;

    return {
      x: viewportCenterX - centerX,
      y: viewportCenterY - centerY
    };
  };

  const fetchStorylineData = async () => {
    try {
      console.log('Fetching storyline data for project:', projectId);
      
      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('storyline_nodes')
        .select('*')
        .eq('project_id', projectId);

      if (nodesError) throw nodesError;
      
      console.log('Raw nodes data:', nodesData);
      
      // Transform the data and normalize node types
      const transformedNodes: StorylineNode[] = (nodesData || []).map((node, index) => {
        let position = { x: 100 + index * 150, y: 100 + index * 100 };
        
        // Try to use existing position if valid
        if (node.position && typeof node.position === 'object' && node.position !== null) {
          const pos = node.position as { x: number; y: number };
          if (typeof pos.x === 'number' && typeof pos.y === 'number') {
            position = pos;
          }
        }
        
        return {
          id: node.id,
          title: node.title,
          content: node.content || '',
          node_type: normalizeNodeType(node.node_type),
          position
        };
      });
      
      console.log('Transformed nodes:', transformedNodes);
      setNodes(transformedNodes);

      // Center viewport on nodes if they exist
      if (transformedNodes.length > 0) {
        const centerPosition = calculateViewportCenter(transformedNodes);
        console.log('Setting pan to:', centerPosition);
        setPan(centerPosition);
      }

      // Fetch connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('storyline_connections')
        .select('*')
        .eq('project_id', projectId);

      if (connectionsError) throw connectionsError;
      console.log('Connections data:', connectionsData);
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(2, Math.max(0.5, prev + delta)));
  }, []);

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

  const resetView = () => {
    if (nodes.length > 0) {
      const centerPosition = calculateViewportCenter(nodes);
      setPan(centerPosition);
      setZoom(1);
    } else {
      setPan({ x: 200, y: 200 });
      setZoom(1);
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="h-screen bg-white flex flex-col">
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
    <div className="h-screen bg-white flex flex-col">
      {/* Header with controls */}
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
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            className="h-7 px-2 text-xs"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas with enhanced grid */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Enhanced SVG with better grid pattern */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ minWidth: '4000px', minHeight: '4000px' }}
          >
            {/* Enhanced Grid Pattern */}
            <defs>
              <pattern id="storyline-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
              </pattern>
              <pattern id="storyline-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
                <rect width="200" height="200" fill="url(#storyline-grid)"/>
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#cbd5e1" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#storyline-grid-major)" />
            
            {/* Enhanced Connections with gradients */}
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
          </svg>

          {/* Enhanced Nodes with proper styling */}
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
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyStorylineViewer;
