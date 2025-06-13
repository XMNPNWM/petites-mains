
export interface WorldbuildingElement {
  id: string;
  name: string;
  type: string;
  description: string | null;
  details?: any;
  tags?: string[];
  image?: string;
}

export interface WorldbuildingElementMock {
  id: number;
  name: string;
  type: string;
  description: string;
  tags: string[];
  image: string;
}

// Utility function to convert mock data to proper format
export const convertMockToWorldbuildingElement = (mock: WorldbuildingElementMock): WorldbuildingElement => {
  return {
    id: mock.id.toString(),
    name: mock.name,
    type: mock.type,
    description: mock.description,
    details: null,
    tags: mock.tags,
    image: mock.image
  };
};
