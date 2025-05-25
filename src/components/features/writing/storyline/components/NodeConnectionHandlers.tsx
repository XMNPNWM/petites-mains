import React, { useCallback } from 'react';
import { useDragHandler } from '../hooks/useDragHandler';
import { useNodeInteractions } from '../hooks/useNodeInteractions';

interface NodeConnectionHandlersProps {
  nodeId: string;
  nodePosition: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  isConnectionSource: boolean;
  onDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
  setDraggedNode: (nodeId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

export const useNodeConnectionHandlers = ({
  nodeId,
  nodePosition,
  zoom,
  pan,
  isConnectionSource,
  onDrag,
  onConnectionStart,
  onConnectionFinish,
  setDraggedNode,
  setSelectedNode
}: NodeConnectionHandlersProps) => {
  const { handleMouseDown } = useDragHandler({
    nodeId,
    nodePosition,
    zoom,
    pan,
    onDrag,
    setDraggedNode,
    setSelectedNode
  });

  const {
    handleKeyboardConnectionStart,
    handleConnectionFinish,
    handleConnectionCircleClick
  } = useNodeInteractions({
    nodeId,
    nodePosition,
    isConnectionSource,
    onConnectionStart,
    onConnectionFinish
  });

  const handleNodeMouseDown = useCallback((e: React.MouseEvent) => {
    console.log(`[NodeHandler] Mouse down on node ${nodeId}, checking for connection mode`);
    
    // Check for connection creation first (Ctrl+click or Cmd+click)
    if (e.ctrlKey || e.metaKey) {
      console.log(`[NodeHandler] Connection mode detected for node ${nodeId}`);
      if (handleKeyboardConnectionStart(e)) {
        return; // Connection started, don't handle as drag
      }
    }
    
    // Otherwise handle normal drag
    console.log(`[NodeHandler] Starting normal drag for node ${nodeId}`);
    handleMouseDown(e);
  }, [handleKeyboardConnectionStart, handleMouseDown, nodeId]);

  const handleNodeMouseUp = useCallback((e: React.MouseEvent) => {
    console.log(`[NodeHandler] Mouse up on node ${nodeId}, isConnectionSource: ${isConnectionSource}`);
    
    // Only handle connection finish if we're not the source node and not dragging
    if (!isConnectionSource) {
      handleConnectionFinish(e);
    }
  }, [isConnectionSource, handleConnectionFinish, nodeId]);

  return {
    handleNodeMouseDown,
    handleNodeMouseUp,
    handleConnectionCircleClick
  };
};
