
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeNodeType } from '@/components/features/writing/storyline/utils/nodeTypeUtils';

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

export const useReadOnlyStorylineViewer = (projectId: string) => {
  const [nodes, setNodes] = useState<StorylineNode[]>([]);
  const [connections, setConnections] = useState<StorylineConnection[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    fetchStorylineData();
  }, [projectId]);

  return {
    nodes,
    connections,
    zoom,
    pan,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView
  };
};
