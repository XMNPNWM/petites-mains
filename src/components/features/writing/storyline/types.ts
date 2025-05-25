
export interface StorylineNode {
  id: string;
  title: string;
  content: string;
  node_type: string;
  position: { x: number; y: number };
}

export interface StorylineConnection {
  id: string;
  source_id: string;
  target_id: string;
  label: string;
}

export interface WorldbuildingElement {
  id: string;
  name: string;
  type: string;
  description?: string;
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
}

export interface NodeFormData {
  title: string;
  content: string;
  node_type: string;
}

export interface DeleteDialogState {
  isOpen: boolean;
  nodeId: string | null;
  nodeName: string;
}

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  panStart: { x: number; y: number };
}

export interface ConnectionLabelState {
  isEditing: boolean;
  connectionId: string | null;
  position: { x: number; y: number } | null;
}
