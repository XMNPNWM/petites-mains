
export interface ChatSession {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  selected_text?: string;
  text_position?: number;
  is_minimized: boolean;
  created_at: string;
  updated_at: string;
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
