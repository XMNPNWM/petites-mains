
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
  const isDragging = useRef(false);
  const mouseIsDown = useRef(false);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const screenToWorld = useCallback(
    createScreenToWorldTransform(pan, zoom),
    [pan.x, pan.y, zoom]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`[Drag] Mouse down on node ${nodeId}`, { nodePosition, zoom, pan });

    // Store initial mouse position for drag threshold
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    isDragging.current = false;
    mouseIsDown.current = true;

    // Find the canvas using multiple selectors for reliability
    let canvas = e.currentTarget.closest('[data-storyline-canvas]') as HTMLElement;
    if (!canvas) {
      // Fallback: look for the canvas background component
      canvas = document.querySelector('[data-storyline-canvas]') as HTMLElement;
    }
    
    if (!canvas) {
      console.error('[Drag] Canvas not found with any selector');
      mouseIsDown.current = false;
      return;
    }

    console.log('[Drag] Canvas found:', canvas);

    const mouseCanvasPos = getCanvasMousePosition(e, canvas);
    console.log('[Drag] Mouse canvas position:', mouseCanvasPos);
    
    // Convert screen coordinates to world coordinates
    const mouseWorldPos = screenToWorld(mouseCanvasPos.x, mouseCanvasPos.y);
    console.log('[Drag] Mouse world position:', mouseWorldPos);
    
    dragOffset.current = {
      x: mouseWorldPos.x - nodePosition.x,
      y: mouseWorldPos.y - nodePosition.y
    };
    console.log('[Drag] Drag offset:', dragOffset.current);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Strict mouse button checking
      if (!mouseIsDown.current || !dragStartPos.current || !dragOffset.current) {
        console.log('[Drag] Mouse move but conditions not met:', {
          mouseIsDown: mouseIsDown.current,
          dragStartPos: !!dragStartPos.current,
          dragOffset: !!dragOffset.current
        });
        return;
      }
      
      // Check if we've moved enough to start dragging
      const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
      const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
      
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        if (!isDragging.current) {
          // First time crossing threshold - start dragging
          isDragging.current = true;
          hasDragged.current = true;
          setDraggedNode(nodeId);
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
          x: currentMouseWorldPos.x - dragOffset.current.x,
          y: currentMouseWorldPos.y - dragOffset.current.y
        };

        console.log(`[Drag] Moving node ${nodeId} to:`, newPosition);
        onDrag(nodeId, newPosition);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      console.log(`[Drag] Mouse up for node ${nodeId}`, { 
        hasDragged: hasDragged.current, 
        isDragging: isDragging.current,
        mouseIsDown: mouseIsDown.current,
        button: upEvent.button
      });
      
      // Immediately stop all tracking
      mouseIsDown.current = false;
      isDragging.current = false;
      
      // Remove event listeners first to prevent any further events
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      
      // Handle the result based on whether we dragged or just clicked
      if (!hasDragged.current) {
        console.log(`[Drag] Click detected on node ${nodeId}, selecting`);
        setSelectedNode(nodeId);
      } else {
        // We dragged - drop the node and clear states
        console.log(`[Drag] Drag completed for node ${nodeId}, dropping node`);
        setDraggedNode(null);
        // Don't clear selection immediately - let it stay selected after drop
      }
      
      // Clean up all refs
      dragStartPos.current = null;
      dragOffset.current = null;
      hasDragged.current = false;
    };

    // Add event listeners with capture to ensure we get them first
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
  }, [nodeId, nodePosition, screenToWorld, setDraggedNode, setSelectedNode, onDrag, zoom, pan]);

  return { handleMouseDown };
};
