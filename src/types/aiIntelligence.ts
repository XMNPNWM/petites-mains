// Enhanced AI Intelligence Types for Sub-Phase 1D.1

// Extend existing knowledge types
export interface SemanticChunk {
  id: string;
  chapter_id: string;
  project_id: string;
  
  // Chunk content and metadata
  content: string;
  chunk_index: number;
  start_position: number;
  end_position: number;
  
  // Chunking analysis data (embeddings will be added later)
  embeddings?: number[];
  embeddings_model?: string;
  
  // NER and entity data (will be populated by Gemini 2.5 Flash)
  named_entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
  entity_types: string[];
  
  // Discourse and dialogue markers (will be populated by Gemini 2.5 Flash)
  discourse_markers: Array<{
    text: string;
    type: string;
    position: number;
  }>;
  dialogue_present: boolean;
  dialogue_speakers: string[];
  
  // Chunking decision data
  breakpoint_score: number;
  breakpoint_reasons: Array<{
    type: 'embedding_drop' | 'ner_shift' | 'discourse_marker' | 'dialogue_shift' | 'max_tokens' | 'min_tokens';
    score: number;
    description: string;
  }>;
  
  // Overlap management
  overlap_with_previous: boolean;
  overlap_with_next: boolean;
  
  // Processing metadata
  processed_at: string;
  processing_version: string;
  
  created_at: string;
  updated_at: string;
}

export interface CharacterRelationship {
  id: string;
  project_id: string;
  
  // Character references
  character_a_id?: string;
  character_b_id?: string;
  character_a_name: string;
  character_b_name: string;
  
  // Relationship details
  relationship_type: string;
  relationship_strength: number; // 0-10
  
  // Dynamic tracking
  strength_history: Array<{
    chapter_id: string;
    strength: number;
    timestamp: string;
    change_reason?: string;
  }>;
  key_interactions: Array<{
    chapter_id: string;
    description: string;
    impact_level: number;
    timestamp: string;
  }>;
  
  // Relationship evolution
  relationship_start_chapter_id?: string;
  relationship_current_status: string;
  
  // AI extraction metadata
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  
  // Flags and verification
  is_flagged: boolean;
  is_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface PlotThread {
  id: string;
  project_id: string;
  
  // Thread identification
  thread_name: string;
  thread_type: string;
  
  // Thread progression
  start_chapter_id?: string;
  current_chapter_id?: string;
  end_chapter_id?: string;
  
  // Thread details
  description?: string;
  key_events: Array<{
    chapter_id: string;
    event_description: string;
    significance_level: number;
    timestamp: string;
  }>;
  characters_involved: string[];
  
  // Thread status
  status: 'active' | 'resolved' | 'abandoned' | 'paused';
  resolution_type?: string;
  
  // Convergence tracking
  converges_with_threads: string[];
  convergence_chapter_id?: string;
  
  // AI extraction metadata
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  
  // Flags and verification
  is_flagged: boolean;
  is_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  
  // Event identification
  event_name: string;
  event_type: 'scene' | 'flashback' | 'flash_forward' | 'background_event';
  
  // Temporal positioning
  chapter_id?: string;
  chronological_order?: number;
  narrative_order?: number;
  
  // Event details
  description?: string;
  duration_description?: string;
  
  // Temporal relationships
  happens_before: string[];
  happens_after: string[];
  concurrent_with: string[];
  
  // Story impact
  characters_involved: string[];
  plot_threads_affected: string[];
  significance_level: number; // 1-10
  
  // Temporal markers
  time_markers: Array<{
    text: string;
    type: string;
    position: number;
  }>;
  
  // AI extraction metadata
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  
  // Flags and verification
  is_flagged: boolean;
  is_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ConflictTracking {
  id: string;
  project_id: string;
  
  // Conflict identification
  conflict_name: string;
  conflict_type: string;
  conflict_subtype?: string;
  
  // Conflict participants
  primary_character_id?: string;
  opposing_force: string;
  characters_involved: string[];
  
  // Conflict progression
  introduction_chapter_id?: string;
  escalation_points: Array<{
    chapter_id: string;
    escalation_level: number;
    description: string;
    timestamp: string;
  }>;
  current_intensity: number; // 1-10
  
  // Resolution tracking
  resolution_chapter_id?: string;
  resolution_method?: string;
  resolution_success?: boolean;
  
  // Conflict details
  description?: string;
  stakes?: string;
  obstacles: Array<{
    description: string;
    difficulty_level: number;
    overcome: boolean;
  }>;
  
  // Story impact
  plot_threads_affected: string[];
  character_growth_impact: Array<{
    character_name: string;
    growth_type: string;
    impact_level: number;
  }>;
  
  // AI extraction metadata
  confidence_score: number;
  extraction_method: 'llm_direct' | 'llm_inferred' | 'user_input' | 'user_correction';
  evidence?: string;
  
  // Flags and verification
  is_flagged: boolean;
  is_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

// Chunking pipeline types
export interface ChunkingConfig {
  min_tokens: number;
  max_tokens: number;
  overlap_sentences: number;
  embedding_threshold: number;
  discourse_marker_weight: number;
  ner_shift_weight: number;
  dialogue_shift_weight: number;
}

export interface ChunkingResult {
  chunks: SemanticChunk[];
  total_chunks: number;
  processing_stats: {
    total_tokens: number;
    avg_chunk_size: number;
    overlap_ratio: number;
    breakpoint_distribution: Record<string, number>;
  };
}

// Analysis and extraction types
export interface AIAnalysisStatus {
  isProcessing: boolean;
  hasErrors: boolean;
  lastProcessedAt?: string;
  currentStep?: string;
  progress: number;
  errorCount: number;
  flaggedItemsCount: number;
}

export interface ExtractionContext {
  projectId: string;
  chapterId: string;
  previousChapters: string[];
  existingKnowledge: {
    characters: string[];
    locations: string[];
    plotThreads: string[];
    conflicts: string[];
  };
}
