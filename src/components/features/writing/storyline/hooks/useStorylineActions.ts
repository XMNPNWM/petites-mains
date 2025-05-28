import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorylineNode, NodeFormData, DeleteDialogState, ConnectionLabelState, WorldbuildingElement } from '../types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

// Map storyline node types to worldbuilding categories
const NODE_TYPE_MAPPING: Record<string, string> = {
  'plotPoint': 'event',
  'character': 'character',
  'location': 'location',
  'scene': 'scene',
  'lore': 'lore',
  'organization': 'organization',
  'religion': 'religion',
  'politics': 'politics',
  'artifact': 'artifact'
};

// Helper function to transform database response to StorylineNode
const transformToStorylineNode = (dbNode: any): StorylineNode => {
  return {
    id: dbNode.id,
    title: dbNode.title,
    content: dbNode.content || '',
    node_type: dbNode.node_type,
    position: typeof dbNode.position === 'object' && dbNode.position !== null
      ? dbNode.position as { x: number; y: number }
      : { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
  };
};

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

  const resetForm = useCallback(() => {
    setEditingNode(null);
    setShowNodeForm(false);
    setNodeForm({ title: '', content: '', node_type: 'scene' });
  }, []);

  const handleFormChange = useCallback((field: keyof NodeFormData, value: string) => {
    setNodeForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNodeEdit = useCallback((node: StorylineNode) => {
    setEditingNode(node);
    setNodeForm({
      title: node.title,
      content: node.content,
      node_type: node.node_type
    });
    setShowNodeForm(true);
  }, []);

  const createOrUpdateWorldbuildingElement = async (node: StorylineNode, isUpdate = false) => {
    try {
      console.log(`${isUpdate ? 'Updating' : 'Creating'} worldbuilding element for node:`, node.title);
      
      const worldbuildingType = NODE_TYPE_MAPPING[node.node_type] || 'event';
      
      if (isUpdate) {
        // Update existing worldbuilding element
        const { error } = await supabase
          .from('worldbuilding_elements')
          .update({
            name: node.title,
            type: worldbuildingType,
            description: node.content || ''
          })
          .eq('storyline_node_id', node.id);

        if (error) throw error;
        console.log('Updated worldbuilding element for node:', node.title);
      } else {
        // Create new worldbuilding element
        const { error } = await supabase
          .from('worldbuilding_elements')
          .insert({
            name: node.title,
            type: worldbuildingType,
            description: node.content || '',
            project_id: projectId,
            storyline_node_id: node.id,
            created_from_storyline: true
          });

        if (error) throw error;
        console.log('Created worldbuilding element for node:', node.title);
      }
    } catch (error) {
      console.error('Error with worldbuilding element:', error);
    }
  };

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNode) {
        // Update existing node
        const { error } = await supabase
          .from('storyline_nodes')
          .update({
            title: nodeForm.title,
            content: nodeForm.content,
            node_type: nodeForm.node_type
          })
          .eq('id', editingNode.id);

        if (error) throw error;
        
        // Update corresponding worldbuilding element
        await createOrUpdateWorldbuildingElement({
          ...editingNode,
          title: nodeForm.title,
          content: nodeForm.content,
          node_type: nodeForm.node_type
        }, true);
        
        console.log('Updated storyline node and worldbuilding element:', nodeForm.title);
      } else {
        // Create new node
        const { data, error } = await supabase
          .from('storyline_nodes')
          .insert({
            title: nodeForm.title,
            content: nodeForm.content,
            node_type: nodeForm.node_type,
            project_id: projectId,
            position: { x: 100, y: 100 },
            layer: 1
          })
          .select()
          .single();

        if (error) throw error;
        
        // Transform and create corresponding worldbuilding element
        const transformedNode = transformToStorylineNode(data);
        await createOrUpdateWorldbuildingElement(transformedNode);
        
        console.log('Created storyline node and worldbuilding element:', nodeForm.title);
      }
      
      resetForm();
      onDataChange();
    } catch (error) {
      console.error('Error saving node:', error);
    }
  }, [editingNode, nodeForm, projectId, resetForm, onDataChange]);

  const createNodeAtPosition = useCallback(async (nodeType: string, position: { x: number; y: number }) => {
    try {
      const { data, error } = await supabase
        .from('storyline_nodes')
        .insert({
          title: `New ${nodeType}`,
          content: '',
          node_type: nodeType,
          project_id: projectId,
          position,
          layer: 1
        })
        .select()
        .single();

      if (error) throw error;
      
      // Transform and create corresponding worldbuilding element
      const transformedNode = transformToStorylineNode(data);
      await createOrUpdateWorldbuildingElement(transformedNode);
      
      console.log('Created node at position and worldbuilding element:', data.title);
      onDataChange();
    } catch (error) {
      console.error('Error creating node:', error);
    }
  }, [projectId, onDataChange]);

  const createNodeFromWorldbuilding = useCallback(async (element: WorldbuildingElement, position: { x: number; y: number }) => {
    try {
      console.log('Creating storyline node from worldbuilding element:', element.name);
      
      const { data, error } = await supabase
        .from('storyline_nodes')
        .insert({
          title: element.name,
          content: element.description || '',
          node_type: element.type,
          project_id: projectId,
          position,
          layer: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Link the worldbuilding element to the new node
      const { error: linkError } = await supabase
        .from('worldbuilding_elements')
        .update({
          storyline_node_id: data.id,
          created_from_storyline: false // This was created from worldbuilding, not storyline
        })
        .eq('id', element.id);

      if (linkError) throw linkError;
      
      console.log('Created storyline node from worldbuilding element and linked them:', element.name);
      onDataChange();
    } catch (error) {
      console.error('Error creating node from worldbuilding:', error);
    }
  }, [projectId, onDataChange]);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDeleteDialogState({
        isOpen: true,
        nodeId,
        nodeName: node.title
      });
    }
  }, [nodes]);

  const handleDeleteConfirm = useCallback(async (deleteFromWorldbuilding: boolean) => {
    if (!deleteDialogState.nodeId) return;

    try {
      console.log('Deleting node:', deleteDialogState.nodeName, 'deleteFromWorldbuilding:', deleteFromWorldbuilding);

      if (deleteFromWorldbuilding) {
        // Delete from worldbuilding first
        const { error: wbError } = await supabase
          .from('worldbuilding_elements')
          .delete()
          .eq('storyline_node_id', deleteDialogState.nodeId);

        if (wbError) throw wbError;
        console.log('Deleted worldbuilding element for node:', deleteDialogState.nodeName);
      } else {
        // Just unlink from worldbuilding
        const { error: unlinkError } = await supabase
          .from('worldbuilding_elements')
          .update({
            storyline_node_id: null,
            created_from_storyline: false
          })
          .eq('storyline_node_id', deleteDialogState.nodeId);

        if (unlinkError) throw unlinkError;
        console.log('Unlinked worldbuilding element from node:', deleteDialogState.nodeName);
      }

      // Delete connections involving this node
      const { error: connectionsError } = await supabase
        .from('storyline_connections')
        .delete()
        .or(`source_id.eq.${deleteDialogState.nodeId},target_id.eq.${deleteDialogState.nodeId}`);

      if (connectionsError) throw connectionsError;

      // Delete the storyline node
      const { error: nodeError } = await supabase
        .from('storyline_nodes')
        .delete()
        .eq('id', deleteDialogState.nodeId);

      if (nodeError) throw nodeError;
      
      console.log('Deleted storyline node:', deleteDialogState.nodeName);
      
      setDeleteDialogState({ isOpen: false, nodeId: null, nodeName: '' });
      onDataChange();
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  }, [deleteDialogState, onDataChange]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogState({ isOpen: false, nodeId: null, nodeName: '' });
  }, []);

  // Connection label editing
  const startEditingConnectionLabel = useCallback((connectionId: string, position: { x: number; y: number }) => {
    setConnectionLabelState({
      isEditing: true,
      connectionId,
      position
    });
  }, []);

  const cancelEditingConnectionLabel = useCallback(() => {
    setConnectionLabelState({
      isEditing: false,
      connectionId: null,
      position: null
    });
  }, []);

  // Connection creation
  const startConnectionCreation = useCallback((sourceNodeId: string, sourcePosition: { x: number; y: number }) => {
    setConnectionCreationState({
      isCreating: true,
      sourceNodeId,
      previewConnection: {
        start: sourcePosition,
        end: sourcePosition
      }
    });
  }, []);

  const updateConnectionPreview = useCallback((mousePosition: { x: number; y: number }) => {
    setConnectionCreationState(prev => {
      if (!prev.isCreating || !prev.previewConnection) return prev;
      
      return {
        ...prev,
        previewConnection: {
          ...prev.previewConnection,
          end: mousePosition
        }
      };
    });
  }, []);

  const finishConnectionCreation = useCallback(async (targetNodeId: string) => {
    if (!connectionCreationState.sourceNodeId || connectionCreationState.sourceNodeId === targetNodeId) {
      setConnectionCreationState({
        isCreating: false,
        sourceNodeId: null,
        previewConnection: null
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('storyline_connections')
        .insert({
          source_id: connectionCreationState.sourceNodeId,
          target_id: targetNodeId,
          project_id: projectId,
          label: ''
        });

      if (error) throw error;
      
      setConnectionCreationState({
        isCreating: false,
        sourceNodeId: null,
        previewConnection: null
      });
      
      onDataChange();
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  }, [connectionCreationState.sourceNodeId, projectId, onDataChange]);

  const cancelConnectionCreation = useCallback(() => {
    setConnectionCreationState({
      isCreating: false,
      sourceNodeId: null,
      previewConnection: null
    });
  }, []);

  // Connection deletion
  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      console.log('Deleting connection:', connectionId);
      
      const { error } = await supabase
        .from('storyline_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      
      console.log('Connection deleted successfully:', connectionId);
      onDataChange();
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  }, [onDataChange]);

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
    cancelConnectionCreation,
    deleteConnection
  };
};
