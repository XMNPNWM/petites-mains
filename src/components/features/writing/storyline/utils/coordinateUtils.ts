
export const createScreenToWorldTransform = (pan: { x: number; y: number }, zoom: number) => {
  return (screenX: number, screenY: number) => ({
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom
  });
};

export const getCanvasMousePosition = (
  e: React.MouseEvent | { clientX: number; clientY: number },
  canvasElement: HTMLElement
) => {
  if (!canvasElement) {
    console.error('[Coordinate] Canvas element is null');
    return { x: 0, y: 0 };
  }

  const canvasRect = canvasElement.getBoundingClientRect();
  console.log('[Coordinate] Canvas rect:', {
    left: canvasRect.left,
    top: canvasRect.top,
    width: canvasRect.width,
    height: canvasRect.height
  });

  const position = {
    x: e.clientX - canvasRect.left,
    y: e.clientY - canvasRect.top
  };
  
  console.log('[Coordinate] Client position:', { clientX: e.clientX, clientY: e.clientY });
  console.log('[Coordinate] Mouse position relative to canvas:', position);
  
  return position;
};

export const calculateNodeConnectionPoint = (
  nodePosition: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  position: 'top' | 'right' | 'bottom' | 'left'
) => {
  switch (position) {
    case 'top':
      return { x: nodePosition.x + nodeWidth / 2, y: nodePosition.y };
    case 'right':
      return { x: nodePosition.x + nodeWidth, y: nodePosition.y + nodeHeight / 2 };
    case 'bottom':
      return { x: nodePosition.x + nodeWidth / 2, y: nodePosition.y + nodeHeight };
    case 'left':
      return { x: nodePosition.x, y: nodePosition.y + nodeHeight / 2 };
  }
};
