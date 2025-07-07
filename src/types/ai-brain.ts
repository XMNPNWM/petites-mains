
// Shared types for AI Brain functionality
export interface PlotThread {
  id: string;
  project_id: string;
  thread_name: string;
  thread_type: string;
  thread_status: string;
  ai_confidence_new?: number;
  characters_involved_names?: string[];
  is_newly_extracted?: boolean;
  is_flagged?: boolean;
  evidence?: string;
  key_events?: string[];
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  event_name: string;
  event_type: string;
  event_description?: string;
  chronological_order: number;
  ai_confidence_new?: number;
  characters_involved_names?: string[];
  is_newly_extracted?: boolean;
  is_flagged?: boolean;
  date_or_time_reference?: string;
  significance?: string;
}

export interface CharacterRelationship {
  id: string;
  project_id: string;
  character_a_name: string;
  character_b_name: string;
  relationship_type: string;
  relationship_strength: number;
  relationship_current_status?: string;
  ai_confidence_new?: number;
  is_newly_extracted?: boolean;
  is_flagged?: boolean;
  evidence?: string;
}

export interface WorldBuildingElement {
  id: string;
  project_id: string;
  name: string;
  type: string;
  description?: string;
}

export interface AIBrainData {
  knowledge: KnowledgeBase[];
  chapterSummaries: ChapterSummary[];
  plotPoints: PlotPoint[];
  plotThreads: PlotThread[];
  timelineEvents: TimelineEvent[];
  characterRelationships: CharacterRelationship[];
  worldBuilding: WorldBuildingElement[];
  themes: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;
}

// Import existing types
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';
