
export const NODE_DIMENSIONS = {
  WIDTH: 112, // w-28 = 112px
  HEIGHT: 80, // approximate height
} as const;

export const DRAG_THRESHOLD = 5; // pixels

export const CONNECTION_CIRCLE_SIZE = 12; // 3 * 4 = 12px (w-3 h-3)
export const CONNECTION_CIRCLE_OFFSET = 6; // half of circle size for positioning

export const NODE_TYPES = [
  { value: 'scene', label: 'Scene' },
  { value: 'character', label: 'Characters' },
  { value: 'location', label: 'Locations' },
  { value: 'lore', label: 'Lore' },
  { value: 'event', label: 'Events' },
  { value: 'organization', label: 'Organizations' },
  { value: 'religion', label: 'Religion' },
  { value: 'politics', label: 'Politics' },
  { value: 'artifact', label: 'Artifacts' }
] as const;
