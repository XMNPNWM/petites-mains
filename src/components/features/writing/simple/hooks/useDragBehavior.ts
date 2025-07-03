
import { useState, useEffect, useRef } from 'react';

export const useDragBehavior = (popupId: string, onPositionUpdate: (id: string, position: { x: number; y: number }) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the left portion of the header (grip + title area)
    const target = e.target as HTMLElement;
    const isActionButton = target.closest('button');
    if (isActionButton) return; // Don't drag when clicking action buttons
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    // Get current popup position from the DOM element's style or current position
    const popupElement = dragRef.current?.closest('.fixed') as HTMLElement;
    if (popupElement) {
      // Parse the current transform or position from the element
      const style = window.getComputedStyle(popupElement);
      const transform = style.transform;
      
      let currentX = 0;
      let currentY = 0;
      
      if (transform && transform !== 'none') {
        // Parse transform matrix
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          currentX = parseFloat(values[4]) || 0;
          currentY = parseFloat(values[5]) || 0;
        }
      } else {
        // Fallback to getBoundingClientRect
        const rect = popupElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
      }
      
      setInitialPosition({ x: currentX, y: currentY });
    } else {
      // Fallback to current mouse position if we can't find the element
      setInitialPosition({ x: e.clientX - 200, y: e.clientY - 50 });
    }
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - 450, initialPosition.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 550, initialPosition.y + deltaY))
      };
      
      onPositionUpdate(popupId, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialPosition, popupId, onPositionUpdate]);

  return { dragRef, isDragging, handleMouseDown };
};
