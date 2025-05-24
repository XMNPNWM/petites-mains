
import { StorylineNode } from '../types';

export const calculateViewportCenter = (nodesList: StorylineNode[]) => {
  if (nodesList.length === 0) return { x: 0, y: 0 };

  // Calculate bounding box of all nodes
  const positions = nodesList.map(node => node.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));

  // Calculate center point
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Calculate pan offset to center the nodes in the viewport
  const viewportCenterX = 200; // Adjusted for smaller panel
  const viewportCenterY = 200;

  const panX = viewportCenterX - centerX;
  const panY = viewportCenterY - centerY;

  return { x: panX, y: panY };
};
