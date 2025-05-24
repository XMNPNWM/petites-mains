import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StorylineControls from './storyline/StorylineControls';
import StorylineCanvas from './storyline/StorylineCanvas';
import NodeForm from './storyline/NodeForm';
import DeleteNodeDialog from './storyline/DeleteNodeDialog';

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

interface StorylinePanelProps {
  projectId: string;
  chapterId?: string;
}

const StorylinePanel = ({ projectId, chapterId }: StorylinePanelProps) => {
  const [nodes, setNodes] = useState<StorylineNode[]>([]);
  const [connections, setConnections] = useState<StorylineConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<StorylineNode | null>(null);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editingNode, setEditingNode] = useState<StorylineNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  
  // Viewport state for pan and zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [nodeForm, setNodeForm] = useState({
    title: '',
    content: '',
    node_type: 'scene'
  });

  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    nodeName: string;
  }>({
    isOpen: false,
    nodeId: null,
    nodeName: ''
  });

  useEffect(() => {
    fetchStorylineData();
  }, [projectId]);

  const calculateViewportCenter = (nodesList: StorylineNode[]) => {
    if (nodesList.length === 0) return { x: 0, y: 0 };

    // Calculate bounding box of all nodes
    const positions = nodesList.map(node => node.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Calculate center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate pan offset to center the nodes in the viewport
    const viewportCenterX = 200; // Adjusted for smaller panel
    const viewportCenterY = 200;

    const panX = viewportCenterX - centerX;
    const panY = viewportCenterY - centerY;

    return { x: panX, y: panY };
  };

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

      // Center viewport on nodes if they exist
      if (transformedNodes.length > 0) {
        const centerPosition = calculateViewportCenter(transformedNodes);
        setPan(centerPosition);
      }

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

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(3, Math.max(0.3, prev + delta)));
  }, []);

  // Canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on canvas background, not on nodes
    if ((e.target as HTMLElement).closest('.storyline-node')) return;
    
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    if (nodes.length > 0) {
      const centerPosition = calculateViewportCenter(nodes);
      setPan(centerPosition);
    } else {
      setPan({ x: 0, y: 0 });
    }
    setZoom(1);
  };

  const createNode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Calculate position in world coordinates (accounting for current pan/zoom)
      const worldX = (200 - pan.x) / zoom + Math.random() * 100;
      const worldY = (200 - pan.y) / zoom + Math.random() * 100;
      const position = { x: worldX, y: worldY };
      
      const { data: nodeData, error: nodeError } = await supabase
        .from('storyline_nodes')
        .insert([{
          ...nodeForm,
          project_id: projectId,
          position,
          layer: 1
        }])
        .select()
        .single();

      if (nodeError) throw nodeError;

      // Also create worldbuilding element
      const { error: worldError } = await supabase
        .from('worldbuilding_elements')
        .insert([{
          name: nodeForm.title,
          type: nodeForm.node_type,
          description: nodeForm.content,
          project_id: projectId
        }]);

      if (worldError) throw worldError;

      resetForm();
      fetchStorylineData();
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };

  const updateNode = async () => {
    if (!editingNode) return;

    try {
      const { error } = await supabase
        .from('storyline_nodes')
        .update({
          title: nodeForm.title,
          content: nodeForm.content,
          node_type: nodeForm.node_type
        })
        .eq('id', editingNode.id);

      if (error) throw error;

      resetForm();
      fetchStorylineData();
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const deleteNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDeleteDialogState({
      isOpen: true,
      nodeId,
      nodeName: node.title
    });
  };

  const handleDeleteConfirm = async (deleteFromWorldbuilding: boolean) => {
    const { nodeId } = deleteDialogState;
    if (!nodeId) return;

    try {
      // Delete the node
      const { error: nodeError } = await supabase
        .from('storyline_nodes')
        .delete()
        .eq('id', nodeId);

      if (nodeError) throw nodeError;

      // Delete connections
      const { error: connectionsError } = await supabase
        .from('storyline_connections')
        .delete()
        .or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);

      if (connectionsError) throw connectionsError;

      // Optionally delete from worldbuilding
      if (deleteFromWorldbuilding) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const { error: worldError } = await supabase
            .from('worldbuilding_elements')
            .delete()
            .eq('name', node.title)
            .eq('project_id', projectId);

          if (worldError) console.error('Error deleting from worldbuilding:', worldError);
        }
      }

      setDeleteDialogState({ isOpen: false, nodeId: null, nodeName: '' });
      fetchStorylineData();
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogState({ isOpen: false, nodeId: null, nodeName: '' });
  };

  const handleNodeEdit = (node: StorylineNode) => {
    setEditingNode(node);
    setNodeForm({
      title: node.title,
      content: node.content,
      node_type: node.node_type
    });
    setShowNodeForm(true);
  };

  const handleNodeDrag = useCallback(async (nodeId: string, newPosition: { x: number; y: number }) => {
    try {
      const { error } = await supabase
        .from('storyline_nodes')
        .update({ position: newPosition })
        .eq('id', nodeId);

      if (error) throw error;
      
      setNodes(prev => prev.map(node => 
        node.id === nodeId ? { ...node, position: newPosition } : node
      ));
    } catch (error) {
      console.error('Error updating node position:', error);
    }
  }, []);

  const resetForm = () => {
    setNodeForm({ title: '', content: '', node_type: 'scene' });
    setShowNodeForm(false);
    setEditingNode(null);
  };

  const handleFormChange = (field: keyof typeof nodeForm, value: string) => {
    setNodeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (editingNode) {
      e.preventDefault();
      updateNode();
    } else {
      createNode(e);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <StorylineControls
        zoom={zoom}
        onAddNode={() => setShowNodeForm(true)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={resetView}
      />

      <StorylineCanvas
        nodes={nodes}
        connections={connections}
        zoom={zoom}
        pan={pan}
        draggedNode={draggedNode}
        onNodeEdit={handleNodeEdit}
        onNodeDelete={deleteNode}
        onNodeDrag={handleNodeDrag}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        setDraggedNode={setDraggedNode}
      />

      <NodeForm
        isVisible={showNodeForm}
        editingNode={editingNode}
        formData={nodeForm}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onCancel={resetForm}
      />

      <DeleteNodeDialog
        isOpen={deleteDialogState.isOpen}
        nodeName={deleteDialogState.nodeName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default StorylinePanel;
