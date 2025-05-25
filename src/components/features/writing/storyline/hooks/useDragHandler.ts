
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

    // Store initial mouse position for drag threshold
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;

    // Get the canvas container
    const canvas = e.currentTarget.closest('.overflow-hidden') as HTMLElement;
    if (!canvas) return;

    const mouseCanvasPos = getCanvasMousePosition(e, canvas);
    
    // Convert screen coordinates to world coordinates
    const mouseWorldPos = screenToWorld(mouseCanvasPos.x, mouseCanvasPos.y);
    const dragOffset = {
      x: mouseWorldPos.x - nodePosition.x,
      y: mouseWorldPos.y - nodePosition.y
    };

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

        onDrag(nodeId, newPosition);
      }
    };

    const handleMouseUp = () => {
      // If we didn't drag, this was a click - select the node
      if (!hasDragged.current) {
        setSelectedNode(nodeId);
      } else {
        // If we dragged, clear the dragged state
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
  }, [nodeId, nodePosition, screenToWorld, setDraggedNode, setSelectedNode, onDrag]);

  return { handleMouseDown };
};
