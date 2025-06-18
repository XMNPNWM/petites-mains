
import { useState, useEffect } from 'react';

interface DragBehaviorProps {
  popupId: string;
  initialPosition: { x: number; y: number };
  onPositionUpdate: (id: string, position: { x: number; y: number }) => void;
}

export const useDragBehavior = ({ popupId, initialPosition, onPositionUpdate }: DragBehaviorProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the left portion of the header (grip + title area)
    const target = e.target as HTMLElement;
    const isActionButton = target.closest('button');
    if (isActionButton) return; // Don't drag when clicking action buttons
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - initialPosition.x,
      y: e.clientY - initialPosition.y
    });
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))
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
  }, [isDragging, dragOffset, popupId, onPositionUpdate]);

  return { handleMouseDown };
};
