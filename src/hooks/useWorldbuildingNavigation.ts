
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StorylineNode {
  id: string;
  title: string;
  position: { x: number; y: number } | null;
}

interface NavigationState {
  [elementId: string]: {
    nodes: StorylineNode[];
    currentIndex: number;
    isNavigating: boolean;
  };
}

export const useWorldbuildingNavigation = () => {
  const [navigationStates, setNavigationStates] = useState<NavigationState>({});

  const findLinkedNodes = useCallback(async (worldbuildingElementId: string): Promise<StorylineNode[]> => {
    try {
      // First get the worldbuilding element details
      const { data: elementData, error: elementError } = await supabase
        .from('worldbuilding_elements')
        .select('project_id, name')
        .eq('id', worldbuildingElementId)
        .single();

      if (elementError || !elementData) {
        console.error('Error getting worldbuilding element:', elementError);
        return [];
      }

      // Find storyline nodes that reference this worldbuilding element
      const { data: nodes, error } = await supabase
        .from('storyline_nodes')
        .select('id, title, position, content')
        .eq('project_id', elementData.project_id)
        .not('position', 'is', null);

      if (error) {
        console.error('Error finding linked nodes:', error);
        return [];
      }

      // Filter nodes that contain references to this worldbuilding element
      const elementName = elementData.name.toLowerCase();
      const linkedNodes = (nodes || []).filter(node => {
        const nodeTitle = node.title.toLowerCase();
        const nodeContent = (node.content || '').toLowerCase();
        return nodeTitle.includes(elementName) || nodeContent.includes(elementName);
      });

      // Transform and filter valid positions
      const validNodes: StorylineNode[] = linkedNodes
        .map(node => ({
          id: node.id,
          title: node.title,
          position: typeof node.position === 'string' 
            ? JSON.parse(node.position) 
            : node.position as { x: number; y: number } | null
        }))
        .filter(node => node.position !== null) as StorylineNode[];

      console.log(`Found ${validNodes.length} linked nodes for element "${elementData.name}":`, validNodes);
      return validNodes;
    } catch (error) {
      console.error('Error finding linked nodes:', error);
      return [];
    }
  }, []);

  const navigateToNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    console.log('Navigating to storyline node:', nodeId, position);
    
    // Dispatch custom event for storyline panel to listen to
    const event = new CustomEvent('navigateToStorylineNode', {
      detail: { nodeId, position }
    });
    window.dispatchEvent(event);
  }, []);

  const navigateToWorldbuildingElement = useCallback(async (elementId: string) => {
    // Set loading state for this specific element
    setNavigationStates(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        isNavigating: true,
        nodes: prev[elementId]?.nodes || [],
        currentIndex: prev[elementId]?.currentIndex || 0
      }
    }));

    try {
      const nodes = await findLinkedNodes(elementId);
      
      if (nodes.length === 0) {
        console.warn('No linked storyline nodes found for element:', elementId);
        setNavigationStates(prev => ({
          ...prev,
          [elementId]: {
            nodes: [],
            currentIndex: 0,
            isNavigating: false
          }
        }));
        return { success: false, message: 'No linked storyline nodes found' };
      }

      // Update state with found nodes
      setNavigationStates(prev => ({
        ...prev,
        [elementId]: {
          nodes,
          currentIndex: 0,
          isNavigating: false
        }
      }));

      // Navigate to the first node
      const firstNode = nodes[0];
      if (firstNode.position) {
        navigateToNode(firstNode.id, firstNode.position);
      }

      return { success: true, nodeCount: nodes.length };
    } catch (error) {
      console.error('Error navigating to element:', error);
      setNavigationStates(prev => ({
        ...prev,
        [elementId]: {
          ...prev[elementId],
          isNavigating: false
        }
      }));
      return { success: false, message: 'Navigation failed' };
    }
  }, [findLinkedNodes, navigateToNode]);

  const navigateToNextNode = useCallback((elementId: string) => {
    const state = navigationStates[elementId];
    if (!state || state.nodes.length === 0) return;

    const nextIndex = (state.currentIndex + 1) % state.nodes.length;
    const nextNode = state.nodes[nextIndex];

    setNavigationStates(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        currentIndex: nextIndex
      }
    }));

    if (nextNode.position) {
      navigateToNode(nextNode.id, nextNode.position);
    }
  }, [navigationStates, navigateToNode]);

  const navigateToPreviousNode = useCallback((elementId: string) => {
    const state = navigationStates[elementId];
    if (!state || state.nodes.length === 0) return;

    const prevIndex = state.currentIndex === 0 ? state.nodes.length - 1 : state.currentIndex - 1;
    const prevNode = state.nodes[prevIndex];

    setNavigationStates(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        currentIndex: prevIndex
      }
    }));

    if (prevNode.position) {
      navigateToNode(prevNode.id, prevNode.position);
    }
  }, [navigationStates, navigateToNode]);

  const getNavigationState = useCallback((elementId: string) => {
    return navigationStates[elementId] || {
      nodes: [],
      currentIndex: 0,
      isNavigating: false
    };
  }, [navigationStates]);

  return {
    navigateToWorldbuildingElement,
    navigateToNextNode,
    navigateToPreviousNode,
    getNavigationState
  };
};
