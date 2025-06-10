
export interface TimelineChat {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  selected_text?: string;
  text_position?: number;
  status?: string;
  created_at: string;
}

export interface TimelinePosition {
  x: number;
  y: number;
}
