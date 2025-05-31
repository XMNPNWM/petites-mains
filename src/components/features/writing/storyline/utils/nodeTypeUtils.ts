
// Utility functions for normalizing node types
export const normalizeNodeType = (nodeType: string): string => {
  const typeMap: { [key: string]: string } = {
    'plotPoint': 'event',
    'plotpoint': 'event',
    'plot': 'event',
    'locations': 'location',
    'characters': 'character',
    'organizations': 'organization',
    'artifacts': 'artifact'
  };
  
  return typeMap[nodeType] || nodeType;
};

export const getNodeTypeDisplayName = (nodeType: string): string => {
  const normalizedType = normalizeNodeType(nodeType);
  
  const displayNames: { [key: string]: string } = {
    'scene': 'Scene',
    'character': 'Character',
    'location': 'Location', 
    'lore': 'Lore',
    'event': 'Event',
    'organization': 'Organization',
    'religion': 'Religion',
    'politics': 'Politics',
    'artifact': 'Artifact'
  };
  
  return displayNames[normalizedType] || normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
};
