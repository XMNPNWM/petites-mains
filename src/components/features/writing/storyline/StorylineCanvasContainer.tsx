
import React, { useCallback } from 'react';
import { StorylineNode as StorylineNodeType, WorldbuildingElement, ConnectionLabelState } from './types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

interface StorylineCanvasContainerProps {
  zoom: number;
  pan: { x: number; y: number };
  connectionCreationState: ConnectionCreationState;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onConnectionPreviewUpdate: (mousePosition: { x: number; y: number }) => void;
  onConnectionCancel: () => void;
  children: React.ReactNode;
}

const StorylineCanvasContainer = ({
  zoom,
  pan,
  connectionCreationState,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onWheel,
  onConnectionPreviewUpdate,
  onConnectionCancel,
  children
}: StorylineCanvasContainerProps) => {
  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

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
      const container = e.currentTarget.closest('.flex-1') as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const mouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
      onConnectionPreviewUpdate(mouseWorldPos);
    }
    
    onCanvasMouseMove(e);
  }, [onCanvasMouseMove, connectionCreationState.isCreating, onConnectionPreviewUpdate, screenToWorld]);

  return (
    <div 
      className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseUp}
      onWheel={onWheel}
      unselectable="on"
    >
      <div
        className="absolute inset-0 select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          userSelect: 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default StorylineCanvasContainer;
