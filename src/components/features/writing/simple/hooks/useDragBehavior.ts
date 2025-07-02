
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
    
    // Get current popup position from the DOM element
    const popupElement = dragRef.current?.closest('.fixed') as HTMLElement;
    if (popupElement) {
      const rect = popupElement.getBoundingClientRect();
      setInitialPosition({ x: rect.left, y: rect.top });
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
