
export interface TextComment {
  id: string;
  project_id: string;
  chapter_id?: string;
  selected_text: string;
  comment_text: string;
  text_position?: number;
  created_at: Date;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export interface SelectedTextContext {
  text: string;
  startOffset: number;
  endOffset: number;
}
