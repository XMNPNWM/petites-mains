
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
  review_notes?: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
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
