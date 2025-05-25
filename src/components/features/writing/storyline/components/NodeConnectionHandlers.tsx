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
    // Check for connection creation first
    if (handleKeyboardConnectionStart(e)) {
      return;
    }
    
    // Otherwise handle normal drag
    handleMouseDown(e);
  }, [handleKeyboardConnectionStart, handleMouseDown]);

  const handleNodeMouseUp = useCallback((e: React.MouseEvent) => {
    // Only handle connection finish if we're not the source node
    if (!isConnectionSource) {
      handleConnectionFinish(e);
    }
  }, [isConnectionSource, handleConnectionFinish]);

  return {
    handleNodeMouseDown,
    handleNodeMouseUp,
    handleConnectionCircleClick
  };
};
