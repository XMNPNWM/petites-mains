
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

export const NODE_TYPE_COLORS = {
  scene: {
    border: 'border-emerald-200',
    rgb: '16, 185, 129' // emerald-500
  },
  character: {
    border: 'border-rose-200', 
    rgb: '244, 63, 94' // rose-500
  },
  location: {
    border: 'border-blue-200',
    rgb: '59, 130, 246' // blue-500
  },
  lore: {
    border: 'border-amber-200',
    rgb: '245, 158, 11' // amber-500
  },
  event: {
    border: 'border-red-200',
    rgb: '239, 68, 68' // red-500
  },
  organization: {
    border: 'border-purple-200',
    rgb: '168, 85, 247' // purple-500
  },
  religion: {
    border: 'border-indigo-200',
    rgb: '99, 102, 241' // indigo-500
  },
  politics: {
    border: 'border-orange-200',
    rgb: '249, 115, 22' // orange-500
  },
  artifact: {
    border: 'border-slate-200',
    rgb: '100, 116, 139' // slate-500
  }
} as const;

export const getNodeTypeColor = (nodeType: string) => {
  return NODE_TYPE_COLORS[nodeType as keyof typeof NODE_TYPE_COLORS] || NODE_TYPE_COLORS.artifact;
};

export const getNodeTypeRgb = (nodeType: string) => {
  return getNodeTypeColor(nodeType).rgb;
};

export const createGradientId = (sourceType: string, targetType: string) => {
  return `gradient-${sourceType}-${targetType}`;
};
