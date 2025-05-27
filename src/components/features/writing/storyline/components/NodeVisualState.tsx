
import React from 'react';

interface NodeVisualStateProps {
  isConnectionSource: boolean;
  isSelected: boolean;
  isDragged: boolean;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const NodeVisualState = React.memo(({
  isConnectionSource,
  isSelected,
  isDragged,
  position,
  onMouseDown,
  onMouseUp,
  onClick,
  children
}: NodeVisualStateProps) => {
  const getNodeClasses = () => {
    const baseClasses = "absolute transition-all duration-200 ease-out select-none";
    const stateClasses = [];
    
    if (isSelected) {
      stateClasses.push("ring-2 ring-blue-500 ring-opacity-50");
    }
    
    if (isConnectionSource) {
      stateClasses.push("ring-2 ring-green-500 ring-opacity-50 animate-pulse");
    }
    
    if (isDragged) {
      stateClasses.push("shadow-2xl scale-105 z-50");
    } else {
      stateClasses.push("hover:shadow-lg hover:scale-[1.02]");
    }
    
    return `${baseClasses} ${stateClasses.join(' ')}`;
  };

  const getNodeStyles = () => {
    return {
      left: position.x,
      top: position.y,
      cursor: isDragged ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      MozUserSelect: 'none' as const,
      msUserSelect: 'none' as const,
      zIndex: isDragged ? 1000 : isSelected ? 100 : 10,
      // Enhanced visual feedback
      filter: isDragged ? 'brightness(1.1)' : undefined,
      transform: isDragged ? 'rotate(2deg)' : undefined
    };
  };

  return (
    <div
      className={getNodeClasses()}
      style={getNodeStyles()}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onClick={onClick}
      data-node-id={position}
    >
      {children}
      
      {/* Enhanced selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none"
          style={{
            transform: 'translate(-4px, -4px)',
            width: 'calc(100% + 8px)',
            height: 'calc(100% + 8px)',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
            borderRadius: '12px'
          }}
        />
      )}
      
      {/* Connection source ring */}
      {isConnectionSource && (
        <div
          className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none animate-pulse"
          style={{
            transform: 'translate(-4px, -4px)',
            width: 'calc(100% + 8px)',
            height: 'calc(100% + 8px)',
            boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)',
            borderRadius: '12px'
          }}
        />
      )}
    </div>
  );
});

NodeVisualState.displayName = 'NodeVisualState';

export default NodeVisualState;
