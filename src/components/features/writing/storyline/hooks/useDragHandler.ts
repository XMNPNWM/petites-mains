
import { useCallback, useRef } from 'react';
import { DRAG_THRESHOLD } from '../constants/nodeConstants';
import { createScreenToWorldTransform, getCanvasMousePosition } from '../utils/coordinateUtils';

interface UseDragHandlerProps {
  nodeId: string;
  nodePosition: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  onDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  setDraggedNode: (nodeId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

export const useDragHandler = ({
  nodeId,
  nodePosition,
  zoom,
  pan,
  onDrag,
  setDraggedNode,
  setSelectedNode
}: UseDragHandlerProps) => {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const screenToWorld = useCallback(
    createScreenToWorldTransform(pan, zoom),
    [pan.x, pan.y, zoom]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`[Drag] Starting drag for node ${nodeId}`, { nodePosition, zoom, pan });

    // Store initial mouse position for drag threshold
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;

    // Get the canvas container using the data attribute
    const canvas = e.currentTarget.closest('[data-storyline-canvas]') as HTMLElement;
    if (!canvas) {
      console.error('[Drag] Canvas not found');
      return;
    }

    console.log('[Drag] Canvas found:', canvas);

    const mouseCanvasPos = getCanvasMousePosition(e, canvas);
    console.log('[Drag] Mouse canvas position:', mouseCanvasPos);
    
    // Convert screen coordinates to world coordinates
    const mouseWorldPos = screenToWorld(mouseCanvasPos.x, mouseCanvasPos.y);
    console.log('[Drag] Mouse world position:', mouseWorldPos);
    
    const dragOffset = {
      x: mouseWorldPos.x - nodePosition.x,
      y: mouseWorldPos.y - nodePosition.y
    };
    console.log('[Drag] Drag offset:', dragOffset);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current) return;
      
      // Check if we've moved enough to start dragging
      const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
      const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
      
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        if (!hasDragged.current) {
          // First time crossing threshold - start dragging
          hasDragged.current = true;
          setDraggedNode(nodeId);
          // Clear selection when starting to drag
          setSelectedNode(null);
          console.log(`[Drag] Started dragging node ${nodeId}`);
        }
        
        moveEvent.preventDefault();
        
        // Convert current mouse position to world coordinates
        const currentMouseCanvasPos = getCanvasMousePosition(
          { clientX: moveEvent.clientX, clientY: moveEvent.clientY } as React.MouseEvent,
          canvas
        );
        const currentMouseWorldPos = screenToWorld(currentMouseCanvasPos.x, currentMouseCanvasPos.y);
        
        const newPosition = {
          x: currentMouseWorldPos.x - dragOffset.x,
          y: currentMouseWorldPos.y - dragOffset.y
        };

        console.log(`[Drag] Moving node ${nodeId} to:`, newPosition);
        onDrag(nodeId, newPosition);
      }
    };

    const handleMouseUp = () => {
      // If we didn't drag, this was a click - select the node
      if (!hasDragged.current) {
        console.log(`[Drag] Click detected on node ${nodeId}, selecting`);
        setSelectedNode(nodeId);
      } else {
        // If we dragged, clear the dragged state
        console.log(`[Drag] Drag completed for node ${nodeId}`);
        setDraggedNode(null);
      }
      
      // Clean up
      dragStartPos.current = null;
      hasDragged.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [nodeId, nodePosition, screenToWorld, setDraggedNode, setSelectedNode, onDrag, zoom, pan]);

  return { handleMouseDown };
};
