
export const createScreenToWorldTransform = (pan: { x: number; y: number }, zoom: number) => {
  return (screenX: number, screenY: number) => ({
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom
  });
};

export const getCanvasMousePosition = (
  e: React.MouseEvent,
  canvasElement: HTMLElement
) => {
  const canvasRect = canvasElement.getBoundingClientRect();
  return {
    x: e.clientX - canvasRect.left,
    y: e.clientY - canvasRect.top
  };
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
