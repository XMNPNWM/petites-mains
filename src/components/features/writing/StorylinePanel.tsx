
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';
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
  onClose: () => void;
}

const StorylinePanel = ({ projectId, chapterId, onClose }: StorylinePanelProps) => {
  const [nodes, setNodes] = useState<StorylineNode[]>([]);
  const [connections, setConnections] = useState<StorylineConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<StorylineNode | null>(null);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editingNode, setEditingNode] = useState<StorylineNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const [nodeForm, setNodeForm] = useState({
    title: '',
    content: '',
    node_type: 'scene'
  });

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
      setNodes(nodesData || []);

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

  const createNode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 };
      
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Storyline Map</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            onClick={() => setShowNodeForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-50">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
            className="absolute cursor-move"
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: draggedNode === node.id ? 10 : 1
            }}
            onMouseDown={(e) => {
              setDraggedNode(node.id);
              const startX = e.clientX - node.position.x;
              const startY = e.clientY - node.position.y;

              const handleMouseMove = (e: MouseEvent) => {
                const newPosition = {
                  x: e.clientX - startX,
                  y: e.clientY - startY
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
            <Card className="w-32 hover:shadow-lg transition-shadow group">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-xs font-medium text-slate-900 line-clamp-2">
                    {node.title}
                  </h4>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeEdit(node);
                      }}
                    >
                      <Edit3 className="w-2 h-2" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <Trash2 className="w-2 h-2" />
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

      {/* Node Form Modal */}
      {showNodeForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <Card className="w-96 max-w-full mx-4">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                {editingNode ? 'Edit Node' : 'Create New Node'}
              </h3>
              <form onSubmit={editingNode ? (e) => { e.preventDefault(); updateNode(); } : createNode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <Input
                    value={nodeForm.title}
                    onChange={(e) => setNodeForm({...nodeForm, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={nodeForm.node_type}
                    onChange={(e) => setNodeForm({...nodeForm, node_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="scene">Scene</option>
                    <option value="character">Character</option>
                    <option value="plot">Plot Point</option>
                    <option value="conflict">Conflict</option>
                    <option value="resolution">Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                  <Textarea
                    value={nodeForm.content}
                    onChange={(e) => setNodeForm({...nodeForm, content: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600">
                    {editingNode ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
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
