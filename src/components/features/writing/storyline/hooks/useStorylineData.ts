import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorylineNode, StorylineConnection, WorldbuildingElement } from '../types';
import { calculateViewportCenter } from '../utils/viewportUtils';
import { normalizeNodeType } from '../utils/nodeTypeUtils';

export const useStorylineData = (projectId: string) => {
  const [nodes, setNodes] = useState<StorylineNode[]>([]);
  const [connections, setConnections] = useState<StorylineConnection[]>([]);
  const [worldbuildingElements, setWorldbuildingElements] = useState<WorldbuildingElement[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const cleanupDuplicateConnections = async (allConnections: StorylineConnection[]) => {
    // Find duplicate connections (same source and target)
    const connectionMap = new Map<string, StorylineConnection[]>();
    
    allConnections.forEach(conn => {
      const key = `${conn.source_id}-${conn.target_id}`;
      const reverseKey = `${conn.target_id}-${conn.source_id}`;
      
      if (!connectionMap.has(key)) {
        connectionMap.set(key, []);
      }
      connectionMap.get(key)!.push(conn);
      
      // Also check for reverse connections
      if (connectionMap.has(reverseKey)) {
        connectionMap.get(reverseKey)!.push(conn);
      }
    });

    const duplicatesToDelete: string[] = [];
    
    connectionMap.forEach((connections, key) => {
      if (connections.length > 1) {
        console.log(`Found ${connections.length} duplicate connections for ${key}`);
        // Keep the first one, mark others for deletion
        for (let i = 1; i < connections.length; i++) {
          duplicatesToDelete.push(connections[i].id);
        }
      }
    });

    if (duplicatesToDelete.length > 0) {
      console.log(`Deleting ${duplicatesToDelete.length} duplicate connections...`);
      
      try {
        const { error } = await supabase
          .from('storyline_connections')
          .delete()
          .in('id', duplicatesToDelete);

        if (error) {
          console.error('Error cleaning up duplicate connections:', error);
        } else {
          console.log('Successfully cleaned up duplicate connections');
        }
      } catch (error) {
        console.error('Error during duplicate cleanup:', error);
      }
    }
  };

  const cleanupOrphanedConnections = async (nodeIds: string[], allConnections: StorylineConnection[]) => {
    // Find connections that reference non-existent nodes
    const orphanedConnections = allConnections.filter(conn => 
      !nodeIds.includes(conn.source_id) || !nodeIds.includes(conn.target_id)
    );

    if (orphanedConnections.length > 0) {
      console.log(`Found ${orphanedConnections.length} orphaned connections, cleaning up...`);
      
      const orphanedIds = orphanedConnections.map(conn => conn.id);
      
      try {
        const { error } = await supabase
          .from('storyline_connections')
          .delete()
          .in('id', orphanedIds);

        if (error) {
          console.error('Error cleaning up orphaned connections:', error);
        } else {
          console.log('Successfully cleaned up orphaned connections');
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  };

  const fetchStorylineData = async () => {
    try {
      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('storyline_nodes')
        .select('*')
        .eq('project_id', projectId);

      if (nodesError) throw nodesError;
      
      // Transform the data to match our interface and normalize node types
      const transformedNodes: StorylineNode[] = (nodesData || []).map(node => ({
        id: node.id,
        title: node.title,
        content: node.content || '',
        node_type: normalizeNodeType(node.node_type), // Normalize the node type
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
      
      const allConnections = connectionsData || [];
      const nodeIds = transformedNodes.map(node => node.id);
      
      // Clean up duplicate connections first
      await cleanupDuplicateConnections(allConnections);
      
      // Then clean up orphaned connections
      await cleanupOrphanedConnections(nodeIds, allConnections);
      
      // Fetch fresh connections after cleanup
      const { data: cleanConnectionsData, error: cleanConnectionsError } = await supabase
        .from('storyline_connections')
        .select('*')
        .eq('project_id', projectId);

      if (cleanConnectionsError) throw cleanConnectionsError;
      
      // Filter out any remaining invalid connections for immediate display
      const validConnections = (cleanConnectionsData || []).filter(conn => {
        const hasValidNodes = nodeIds.includes(conn.source_id) && nodeIds.includes(conn.target_id);
        if (!hasValidNodes) {
          console.warn(`Connection ${conn.id} still references missing nodes after cleanup`);
        }
        return hasValidNodes;
      });
      
      console.log(`Loaded ${validConnections.length} valid connections`);
      setConnections(validConnections);

      // Fetch worldbuilding elements with synchronization fields
      const { data: worldbuildingData, error: worldbuildingError } = await supabase
        .from('worldbuilding_elements')
        .select('id, name, type, description, storyline_node_id, created_from_storyline')
        .eq('project_id', projectId);

      if (worldbuildingError) throw worldbuildingError;
      setWorldbuildingElements(worldbuildingData || []);
    } catch (error) {
      console.error('Error fetching storyline data:', error);
    }
  };

  const updateNodePosition = async (nodeId: string, newPosition: { x: number; y: number }) => {
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
  };

  const updateConnectionLabel = async (connectionId: string, label: string) => {
    try {
      const { error } = await supabase
        .from('storyline_connections')
        .update({ label })
        .eq('id', connectionId);

      if (error) throw error;
      
      setConnections(prev => prev.map(connection => 
        connection.id === connectionId ? { ...connection, label } : connection
      ));
    } catch (error) {
      console.error('Error updating connection label:', error);
    }
  };

  useEffect(() => {
    fetchStorylineData();
  }, [projectId]);

  return {
    nodes,
    connections,
    worldbuildingElements,
    pan,
    setPan,
    fetchStorylineData,
    updateNodePosition,
    updateConnectionLabel
  };
};
