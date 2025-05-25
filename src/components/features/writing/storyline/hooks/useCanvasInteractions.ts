
import { useCallback } from 'react';
import { createScreenToWorldTransform, getCanvasMousePosition } from '../utils/coordinateUtils';

interface UseCanvasInteractionsProps {
  zoom: number;
  pan: { x: number; y: number };
  connectionCreationState: {
    isCreating: boolean;
    sourceNodeId: string | null;
    previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  };
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onConnectionPreviewUpdate: (mousePosition: { x: number; y: number }) => void;
  onConnectionCancel: () => void;
}

export const useCanvasInteractions = ({
  zoom,
  pan,
  connectionCreationState,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onConnectionPreviewUpdate,
  onConnectionCancel
}: UseCanvasInteractionsProps) => {
  const screenToWorld = useCallback(
    createScreenToWorldTransform(pan, zoom),
    [pan.x, pan.y, zoom]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Skip handling for right-click (context menu)
    if (e.button === 2) {
      return;
    }
    
    // Cancel connection creation if clicking on empty canvas
    if (connectionCreationState.isCreating) {
      onConnectionCancel();
      return;
    }
    
    // Only handle left-click for panning
    if (e.button === 0) {
      onCanvasMouseDown(e);
    }
  }, [onCanvasMouseDown, connectionCreationState.isCreating, onConnectionCancel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update connection preview if creating connection
    if (connectionCreationState.isCreating) {
      const canvas = e.currentTarget as HTMLElement;
      const mouseCanvasPos = getCanvasMousePosition(e, canvas);
      const mouseWorldPos = screenToWorld(mouseCanvasPos.x, mouseCanvasPos.y);
      onConnectionPreviewUpdate(mouseWorldPos);
    }
    
    onCanvasMouseMove(e);
  }, [onCanvasMouseMove, connectionCreationState.isCreating, onConnectionPreviewUpdate, screenToWorld]);

  return {
    handleMouseDown,
    handleMouseMove,
    screenToWorld
  };
};
