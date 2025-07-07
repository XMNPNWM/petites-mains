export interface KnowledgeBase {
  id: string;
  project_id: string;
  name: string;
  category: 'character' | 'plot_point' | 'world_building' | 'theme' | 'setting' | 'object' | 'event' | 'relationship' | 'other';
  subcategory?: string;
  description?: string;
  details: Record<string, any>;
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  reasoning?: string;
  source_chapter_id?: string;
  source_paragraph_hash?: string;
  source_text_excerpt?: string;
  is_flagged: boolean;
  is_verified: boolean;
  is_newly_extracted?: boolean;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  // Enhanced temporal fields
  source_chapter_ids?: string[];
  ai_confidence_new?: number;
}

export interface KnowledgeFact {
  id: string;
  knowledge_base_id: string;
  fact_key: string;
  fact_value: string;
  fact_type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  reasoning?: string;
  source_paragraph_hash?: string;
  source_text_excerpt?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentHash {
  id: string;
  chapter_id: string;
  original_content_hash: string;
  enhanced_content_hash?: string;
  paragraph_hashes: string[];
  last_processed_at: string;
  processing_version: string;
  has_changes: boolean;
  change_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingJob {
  id: string;
  project_id: string;
  chapter_id?: string;
  job_type: 'full_analysis' | 'incremental_update' | 'fact_extraction';
  state: 'pending' | 'thinking' | 'analyzing' | 'extracting' | 'done' | 'failed';
  progress_percentage: number;
  current_step?: string;
  total_steps: number;
  completed_steps: number;
  processing_options: Record<string, any>;
  word_count?: number;
  estimated_duration_minutes?: number;
  results_summary: Record<string, any>;
  error_message?: string;
  error_details?: Record<string, any>;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface AnalysisStatus {
  isProcessing: boolean;
  hasErrors: boolean;
  lastProcessedAt?: string;
  currentJob?: ProcessingJob;
  errorCount: number;
  lowConfidenceFactsCount: number;
}

// Add new extended knowledge categories (union type)
export type ExtendedKnowledgeCategory = 
  | 'character' 
  | 'plot_point' 
  | 'world_building' 
  | 'theme' 
  | 'setting' 
  | 'object' 
  | 'event' 
  | 'relationship' 
  | 'other'
  | 'writing_style'
  | 'dialogue_pattern'
  | 'pacing_analysis'
  | 'narrative_perspective'
  | 'conflict_architecture'  
  | 'timeline_event'
  | 'character_arc'
  | 'plot_thread'
  | 'world_rule'
  | 'consistency_marker'
  | 'foreshadowing'
  | 'callback';

// Enhanced Knowledge Base interface with new temporal fields
export interface EnhancedKnowledgeBase {
  id: string;
  project_id: string;
  name: string;
  category: ExtendedKnowledgeCategory;
  subcategory?: string;
  description?: string;
  details: Record<string, any>;
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  reasoning?: string;
  source_chapter_id?: string;
  source_paragraph_hash?: string;
  source_text_excerpt?: string;
  is_flagged: boolean;
  is_verified: boolean;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  
  // Enhanced temporal fields
  arc_progression?: Record<string, any>;
  first_appearance_chapter_id?: string;
  last_appearance_chapter_id?: string;
  chapter_progression?: Array<{
    chapter_id: string;
    changes: string[];
    timestamp: string;
  }>;
  
  // New metadata fields
  source_chapter_ids?: string[];
  is_newly_extracted?: boolean;
  ai_confidence_new?: number;
}

// Chapter Summary interface
export interface ChapterSummary {
  id: string;
  chapter_id: string;
  project_id: string;
  title?: string;
  summary_short?: string;
  summary_long?: string;
  key_events_in_chapter?: string[];
  primary_focus?: string[];
  ai_confidence?: number;
  source_chapter_id?: string;
  is_newly_extracted?: boolean;
  created_at: string;
  updated_at: string;
}

// Plot Point interface  
export interface PlotPoint {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  plot_thread_name?: string;
  significance?: string;
  characters_involved_names?: string[];
  ai_confidence?: number;
  source_chapter_ids?: string[];
  is_newly_extracted?: boolean;
  created_at: string;
  updated_at: string;
}

// Enhanced extraction response structure
export interface ComprehensiveExtractionResult {
  success: boolean;
  extractedData: {
    chapter_summary?: {
      title: string;
      summary_short: string;
      summary_long: string;
      key_events_in_chapter: string[];
      primary_focus: string[];
    };
    extracted_data: {
      characters: Array<{
        name: string;
        aliases?: string[];
        role?: string;
        description?: string;
        traits?: string[];
        goals?: string[];
        motivations?: string[];
        backstory_elements?: string[];
        arc_status?: string;
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
      relationships: Array<{
        source_character_name: string;
        target_character_name: string;
        type: string;
        strength?: number;
        description?: string;
        current_status?: string;
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
      plot_points: Array<{
        name: string;
        description?: string;
        plot_thread_name?: string;
        significance?: string;
        characters_involved_names?: string[];
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
      plot_threads: Array<{
        name: string;
        type?: string;
        status?: string;
        key_events?: string[];
        characters_involved_names?: string[];
        resolution?: string;
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
      timeline_events: Array<{
        event_summary: string;
        chronological_order?: number;
        date_or_time_reference?: string;
        significance?: string;
        characters_involved_names?: string[];
        plot_threads_impacted_names?: string[];
        locations_involved_names?: string[];
        ai_confidence?: number;
        source_chapter_id?: string;
        is_newly_extracted?: boolean;
      }>;
      world_building: Array<{
        name: string;
        type?: string;
        description?: string;
        significance?: string;
        associated_characters_names?: string[];
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
      themes: Array<{
        name: string;
        exploration_summary?: string;
        key_moments_or_characters?: string[];
        ai_confidence?: number;
        source_chapter_ids?: string[];
        is_newly_extracted?: boolean;
      }>;
    };
  };
  storedCount: number;
  storageDetails: Record<string, any>;
  errors?: string[];
  validation: {
    confidence: number;
    issues: string[];
    method: string;
  };
  processingTime: number;
  message: string;
}
