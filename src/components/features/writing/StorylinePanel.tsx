import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

      setNodeForm({ title: '', content: '', node_type: 'scene' });
      setShowNodeForm(false);
      setEditingNode(null);
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

      setNodeForm({ title: '', content: '', node_type: 'scene' });
      setShowNodeForm(false);
      setEditingNode(null);
      fetchStorylineData();
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const deleteNode = async (nodeId: string) => {
    // Ask user if they want to delete from worldbuilding too
    const deleteFromWorld = window.confirm(
      'Do you want to also delete this element from your worldbuilding library?'
    );

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
      if (deleteFromWorld) {
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

      fetchStorylineData();
    } catch (error) {
      console.error('Error deleting node:', error);
    }
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

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header with zoom controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 text-sm">Storyline Map</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            onClick={() => setShowNodeForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-xs h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Node
          </Button>
          <div className="w-px h-4 bg-slate-300"></div>
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

      {/* Canvas with pan and zoom */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
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
              className="absolute cursor-move storyline-node"
              style={{
                left: node.position.x,
                top: node.position.y,
                zIndex: draggedNode === node.id ? 10 : 1
              }}
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent canvas panning when dragging nodes
                setDraggedNode(node.id);
                const rect = e.currentTarget.getBoundingClientRect();
                const startX = (e.clientX - rect.left) / zoom;
                const startY = (e.clientY - rect.top) / zoom;

                const handleMouseMove = (e: MouseEvent) => {
                  const newPosition = {
                    x: (e.clientX - pan.x) / zoom - startX,
                    y: (e.clientY - pan.y) / zoom - startY
                  };
                  handleNodeDrag(node.id, newPosition);
                };

                const handleMouseUp = () => {
                  setDraggedNode(null);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <Card className="w-28 hover:shadow-lg transition-shadow group">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-xs font-medium text-slate-900 line-clamp-2">
                      {node.title}
                    </h4>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeEdit(node);
                        }}
                      >
                        <Edit3 className="w-1.5 h-1.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <Trash2 className="w-1.5 h-1.5" />
                      </Button>
                    </div>
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

      {/* Node Form Modal */}
      {showNodeForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <Card className="w-80 max-w-full mx-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">
                {editingNode ? 'Edit Node' : 'Create New Node'}
              </h3>
              <form onSubmit={editingNode ? (e) => { e.preventDefault(); updateNode(); } : createNode} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                  <Input
                    value={nodeForm.title}
                    onChange={(e) => setNodeForm({...nodeForm, title: e.target.value})}
                    required
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={nodeForm.node_type}
                    onChange={(e) => setNodeForm({...nodeForm, node_type: e.target.value})}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm h-8"
                  >
                    <option value="scene">Scene</option>
                    <option value="character">Character</option>
                    <option value="plot">Plot Point</option>
                    <option value="conflict">Conflict</option>
                    <option value="resolution">Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Content</label>
                  <Textarea
                    value={nodeForm.content}
                    onChange={(e) => setNodeForm({...nodeForm, content: e.target.value})}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 text-xs h-7">
                    {editingNode ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      setShowNodeForm(false);
                      setEditingNode(null);
                      setNodeForm({ title: '', content: '', node_type: 'scene' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StorylinePanel;
