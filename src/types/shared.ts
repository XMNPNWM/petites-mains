
export interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

export interface RefinementData {
  id: string;
  chapter_id: string;
  original_content: string;
  enhanced_content: string;
  refinement_status: 'untouched' | 'in_progress' | 'completed' | 'updated';
  ai_changes: any[];
  context_summary: string;
}

export interface AIChange {
  id: string;
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  confidence_score: number;
}

export interface TimelineChat {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'chat';
  position: { x: number; y: number };
  selected_text?: string;
  text_position?: number;
  line_number?: number;
  status?: string;
  created_at: string;
}

export interface ScrollPositions {
  original: number;
  enhanced: number;
}

export interface HighlightedRange {
  start: number;
  end: number;
}

// Navigation-related types (NEW)
export interface NavigationState {
  selectedChangeId: string | null;
  highlightedRange: { start: number; end: number } | null;
  originalScrollPosition: number;
  enhancedScrollPosition: number;
}

export interface ChapterTransitionState {
  isTransitioning: boolean;
  previousChapterId: string | null;
  currentChapterId: string | null;
  transitionStartTime: number | null;
}
