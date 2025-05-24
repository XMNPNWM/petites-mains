
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorylineNode, NodeFormData, DeleteDialogState } from '../types';

export const useStorylineActions = (
  projectId: string,
  nodes: StorylineNode[],
  zoom: number,
  pan: { x: number; y: number },
  onDataChange: () => void
) => {
  const [editingNode, setEditingNode] = useState<StorylineNode | null>(null);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    title: '',
    content: '',
    node_type: 'scene'
  });
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    nodeId: null,
    nodeName: ''
  });

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
      onDataChange();
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
      onDataChange();
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
      onDataChange();
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

  const resetForm = () => {
    setNodeForm({ title: '', content: '', node_type: 'scene' });
    setShowNodeForm(false);
    setEditingNode(null);
  };

  const handleFormChange = (field: keyof NodeFormData, value: string) => {
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

  return {
    editingNode,
    showNodeForm,
    nodeForm,
    deleteDialogState,
    setShowNodeForm,
    deleteNode,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleNodeEdit,
    resetForm,
    handleFormChange,
    handleFormSubmit
  };
};
