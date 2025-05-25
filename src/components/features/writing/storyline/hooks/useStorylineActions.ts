import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorylineNode, NodeFormData, DeleteDialogState, WorldbuildingElement, ConnectionLabelState } from '../types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

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
  const [connectionLabelState, setConnectionLabelState] = useState<ConnectionLabelState>({
    isEditing: false,
    connectionId: null,
    position: null
  });
  const [connectionCreationState, setConnectionCreationState] = useState<ConnectionCreationState>({
    isCreating: false,
    sourceNodeId: null,
    previewConnection: null
  });

  const createNodeAtPosition = async (nodeType: string, position: { x: number; y: number }) => {
    try {
      const { data: nodeData, error: nodeError } = await supabase
        .from('storyline_nodes')
        .insert([{
          title: `New ${nodeType}`,
          content: '',
          node_type: nodeType,
          project_id: projectId,
          position,
          layer: 1
        }])
        .select()
        .single();

      if (nodeError) throw nodeError;

      // Create linked worldbuilding element
      const { error: worldError } = await supabase
        .from('worldbuilding_elements')
        .insert([{
          name: `New ${nodeType}`,
          type: nodeType,
          description: '',
          project_id: projectId,
          storyline_node_id: nodeData.id,
          created_from_storyline: true
        }]);

      if (worldError) throw worldError;

      onDataChange();
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };

  const createNodeFromWorldbuilding = async (element: WorldbuildingElement, position: { x: number; y: number }) => {
    try {
      const { data: nodeData, error: nodeError } = await supabase
        .from('storyline_nodes')
        .insert([{
          title: element.name,
          content: element.description || '',
          node_type: element.type,
          project_id: projectId,
          position,
          layer: 1
        }])
        .select()
        .single();

      if (nodeError) throw nodeError;

      // Link existing worldbuilding element to new node if it's not already linked
      if (!element.storyline_node_id) {
        const { error: linkError } = await supabase
          .from('worldbuilding_elements')
          .update({ 
            storyline_node_id: nodeData.id,
            created_from_storyline: false // Keep original source
          })
          .eq('id', element.id);

        if (linkError) throw linkError;
      }

      onDataChange();
    } catch (error) {
      console.error('Error creating node from worldbuilding:', error);
    }
  };

  const createConnection = async (sourceId: string, targetId: string) => {
    try {
      const { error } = await supabase
        .from('storyline_connections')
        .insert([{
          project_id: projectId,
          source_id: sourceId,
          target_id: targetId,
          label: ''
        }]);

      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  };

  const startConnectionCreation = (sourceNodeId: string, sourcePosition: { x: number; y: number }) => {
    console.log('Starting connection creation:', { sourceNodeId, sourcePosition });
    setConnectionCreationState({
      isCreating: true,
      sourceNodeId,
      previewConnection: {
        start: sourcePosition,
        end: sourcePosition
      }
    });
  };

  const updateConnectionPreview = (mousePosition: { x: number; y: number }) => {
    if (connectionCreationState.isCreating && connectionCreationState.previewConnection) {
      setConnectionCreationState(prev => ({
        ...prev,
        previewConnection: {
          start: prev.previewConnection!.start,
          end: mousePosition
        }
      }));
    }
  };

  const finishConnectionCreation = async (targetNodeId: string) => {
    if (connectionCreationState.isCreating && connectionCreationState.sourceNodeId) {
      // Prevent self-connections
      if (connectionCreationState.sourceNodeId === targetNodeId) {
        console.log('Cannot connect node to itself');
        cancelConnectionCreation();
        return;
      }

      console.log('Finishing connection:', {
        source: connectionCreationState.sourceNodeId,
        target: targetNodeId
      });

      await createConnection(connectionCreationState.sourceNodeId, targetNodeId);
      cancelConnectionCreation();
    }
  };

  const cancelConnectionCreation = () => {
    console.log('Canceling connection creation');
    setConnectionCreationState({
      isCreating: false,
      sourceNodeId: null,
      previewConnection: null
    });
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

      // Create linked worldbuilding element
      const { error: worldError } = await supabase
        .from('worldbuilding_elements')
        .insert([{
          name: nodeForm.title,
          type: nodeForm.node_type,
          description: nodeForm.content,
          project_id: projectId,
          storyline_node_id: nodeData.id,
          created_from_storyline: true
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
      const { error: nodeError } = await supabase
        .from('storyline_nodes')
        .update({
          title: nodeForm.title,
          content: nodeForm.content,
          node_type: nodeForm.node_type
        })
        .eq('id', editingNode.id);

      if (nodeError) throw nodeError;

      // Update linked worldbuilding element
      const { error: worldError } = await supabase
        .from('worldbuilding_elements')
        .update({
          name: nodeForm.title,
          type: nodeForm.node_type,
          description: nodeForm.content
        })
        .eq('storyline_node_id', editingNode.id);

      if (worldError) throw worldError;

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
      // Delete connections first
      const { error: connectionsError } = await supabase
        .from('storyline_connections')
        .delete()
        .or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);

      if (connectionsError) throw connectionsError;

      // Handle worldbuilding element based on user choice
      if (deleteFromWorldbuilding) {
        // Delete linked worldbuilding element
        const { error: worldError } = await supabase
          .from('worldbuilding_elements')
          .delete()
          .eq('storyline_node_id', nodeId);

        if (worldError) throw worldError;
      } else {
        // Unlink worldbuilding element but keep it
        const { error: unlinkError } = await supabase
          .from('worldbuilding_elements')
          .update({ storyline_node_id: null })
          .eq('storyline_node_id', nodeId);

        if (unlinkError) throw unlinkError;
      }

      // Delete the storyline node
      const { error: nodeError } = await supabase
        .from('storyline_nodes')
        .delete()
        .eq('id', nodeId);

      if (nodeError) throw nodeError;

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

  const startEditingConnectionLabel = (connectionId: string, position: { x: number; y: number }) => {
    setConnectionLabelState({
      isEditing: true,
      connectionId,
      position
    });
  };

  const cancelEditingConnectionLabel = () => {
    setConnectionLabelState({
      isEditing: false,
      connectionId: null,
      position: null
    });
  };

  return {
    editingNode,
    showNodeForm,
    nodeForm,
    deleteDialogState,
    connectionLabelState,
    connectionCreationState,
    setShowNodeForm,
    deleteNode,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleNodeEdit,
    resetForm,
    handleFormChange,
    handleFormSubmit,
    createNodeAtPosition,
    createNodeFromWorldbuilding,
    startEditingConnectionLabel,
    cancelEditingConnectionLabel,
    startConnectionCreation,
    updateConnectionPreview,
    finishConnectionCreation,
    cancelConnectionCreation
  };
};
