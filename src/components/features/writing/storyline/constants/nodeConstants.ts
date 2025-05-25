
export const NODE_DIMENSIONS = {
  WIDTH: 112, // w-28 = 112px
  HEIGHT: 80, // approximate height
} as const;

export const DRAG_THRESHOLD = 5; // pixels

export const CONNECTION_CIRCLE_SIZE = 12; // 3 * 4 = 12px (w-3 h-3)
export const CONNECTION_CIRCLE_OFFSET = 6; // half of circle size for positioning

export const NODE_TYPES = [
  { value: 'scene', label: 'Scene' },
  { value: 'character', label: 'Character' },
  { value: 'location', label: 'Location' },
  { value: 'plot_point', label: 'Plot Point' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'resolution', label: 'Resolution' }
] as const;
