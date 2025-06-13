
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StorylineNode {
  id: string;
  title: string;
  position: { x: number; y: number } | null;
}

export const useStorylineWorldbuildingNavigation = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [linkedNodes, setLinkedNodes] = useState<StorylineNode[]>([]);

  const findLinkedNodes = useCallback(async (worldbuildingElementId: string): Promise<StorylineNode[]> => {
    try {
      setIsNavigating(true);
      
      const { data, error } = await supabase
        .from('storyline_nodes')
        .select('id, title, position')
        .eq('project_id', (await supabase
          .from('worldbuilding_elements')
          .select('project_id')
          .eq('id', worldbuildingElementId)
          .single()).data?.project_id)
        .not('position', 'is', null);

      if (error) throw error;

      // Filter nodes that are actually linked to this worldbuilding element
      const linkedNodesData = data?.filter(node => {
        // This is a simplified check - in a full implementation, you'd have a proper
        // many-to-many relationship table between storyline_nodes and worldbuilding_elements
        return true; // For now, return all nodes in the project
      }) || [];

      setLinkedNodes(linkedNodesData);
      setCurrentNodeIndex(0);
      
      return linkedNodesData;
    } catch (error) {
      console.error('Error finding linked nodes:', error);
      return [];
    } finally {
      setIsNavigating(false);
    }
  }, []);

  const navigateToNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    // Dispatch custom event that the storyline panel can listen to
    const event = new CustomEvent('navigateToStorylineNode', {
      detail: { nodeId, position }
    });
    window.dispatchEvent(event);
  }, []);

  const navigateToWorldbuildingElement = useCallback(async (worldbuildingElementId: string) => {
    const nodes = await findLinkedNodes(worldbuildingElementId);
    
    if (nodes.length === 0) {
      console.warn('No linked storyline nodes found for worldbuilding element:', worldbuildingElementId);
      return;
    }

    // Navigate to the first node
    const firstNode = nodes[0];
    if (firstNode.position) {
      navigateToNode(firstNode.id, firstNode.position);
    }
  }, [findLinkedNodes, navigateToNode]);

  const navigateToNextNode = useCallback(() => {
    if (linkedNodes.length === 0) return;

    const nextIndex = (currentNodeIndex + 1) % linkedNodes.length;
    setCurrentNodeIndex(nextIndex);
    
    const nextNode = linkedNodes[nextIndex];
    if (nextNode.position) {
      navigateToNode(nextNode.id, nextNode.position);
    }
  }, [linkedNodes, currentNodeIndex, navigateToNode]);

  const navigateToPreviousNode = useCallback(() => {
    if (linkedNodes.length === 0) return;

    const prevIndex = currentNodeIndex === 0 ? linkedNodes.length - 1 : currentNodeIndex - 1;
    setCurrentNodeIndex(prevIndex);
    
    const prevNode = linkedNodes[prevIndex];
    if (prevNode.position) {
      navigateToNode(prevNode.id, prevNode.position);
    }
  }, [linkedNodes, currentNodeIndex, navigateToNode]);

  return {
    isNavigating,
    linkedNodes,
    currentNodeIndex,
    navigateToWorldbuildingElement,
    navigateToNextNode,
    navigateToPreviousNode
  };
};
