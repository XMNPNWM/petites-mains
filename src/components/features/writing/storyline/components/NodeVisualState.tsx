
import React from 'react';

interface NodeVisualStateProps {
  isConnectionSource: boolean;
  isSelected: boolean;
  isDragged: boolean;
  children: React.ReactNode;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

const NodeVisualState = React.memo(({
  isConnectionSource,
  isSelected,
  isDragged,
  children,
  position,
  onMouseDown,
  onMouseUp
}: NodeVisualStateProps) => {
  const getNodeClassName = () => {
    let className = "absolute cursor-move storyline-node select-none group";
    
    if (isConnectionSource) {
      className += " ring-2 ring-blue-400";
    } else if (isSelected) {
      className += " ring-2 ring-purple-400 ring-opacity-60";
    }
    
    return className;
  };

  return (
    <div
      className={getNodeClassName()}
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragged ? 10 : isSelected ? 5 : 1,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      unselectable="on"
    >
      {children}
    </div>
  );
});

NodeVisualState.displayName = 'NodeVisualState';

export default NodeVisualState;
