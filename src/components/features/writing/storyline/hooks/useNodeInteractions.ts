
import { useCallback } from 'react';
import { NODE_DIMENSIONS } from '../constants/nodeConstants';
import { calculateNodeConnectionPoint } from '../utils/coordinateUtils';

interface UseNodeInteractionsProps {
  nodeId: string;
  nodePosition: { x: number; y: number };
  isConnectionSource: boolean;
  onConnectionStart: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionFinish: (nodeId: string) => void;
}

export const useNodeInteractions = ({
  nodeId,
  nodePosition,
  isConnectionSource,
  onConnectionStart,
  onConnectionFinish
}: UseNodeInteractionsProps) => {
  const handleKeyboardConnectionStart = useCallback((e: React.MouseEvent) => {
    // Check if Ctrl/Cmd key is pressed for connection creation
    if (e.ctrlKey || e.metaKey) {
      const nodeCenter = {
        x: nodePosition.x + NODE_DIMENSIONS.WIDTH / 2,
        y: nodePosition.y + NODE_DIMENSIONS.HEIGHT / 2
      };
      onConnectionStart(nodeId, nodeCenter);
      return true;
    }
    return false;
  }, [nodeId, nodePosition, onConnectionStart]);

  const handleConnectionFinish = useCallback((e: React.MouseEvent) => {
    // If we're in connection creation mode and this is not the source node
    if (!isConnectionSource) {
      e.preventDefault();
      e.stopPropagation();
      onConnectionFinish(nodeId);
    }
  }, [isConnectionSource, onConnectionFinish, nodeId]);

  const handleConnectionCircleClick = useCallback((
    e: React.MouseEvent,
    position: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const connectionPoint = calculateNodeConnectionPoint(
      nodePosition,
      NODE_DIMENSIONS.WIDTH,
      NODE_DIMENSIONS.HEIGHT,
      position
    );
    
    onConnectionStart(nodeId, connectionPoint);
  }, [nodePosition, onConnectionStart, nodeId]);

  return {
    handleKeyboardConnectionStart,
    handleConnectionFinish,
    handleConnectionCircleClick
  };
};
