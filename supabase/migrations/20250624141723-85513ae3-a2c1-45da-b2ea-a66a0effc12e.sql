
-- =====================================================
-- Sub-Phase 1A: Database Schema Foundation
-- Enhanced Base Knowledge Accumulation Engine
-- =====================================================

-- 1. ENUMS AND TYPES
-- =====================================================

-- Knowledge category types
CREATE TYPE public.knowledge_category AS ENUM (
  'character',
  'plot_point', 
  'world_building',
  'theme',
  'setting',
  'object',
  'event',
  'relationship',
  'other'
);

-- Knowledge extraction methods
CREATE TYPE public.extraction_method AS ENUM (
  'llm_direct',
  'llm_inferred', 
  'user_input',
  'user_correction'
);

-- Processing job states
CREATE TYPE public.processing_state AS ENUM (
  'pending',
  'thinking',
  'analyzing',
  'extracting',
  'done',
  'failed'
);

-- Change types for tracking
CREATE TYPE public.change_type AS ENUM (
  'addition',
  'modification',
  'deletion',
  'confidence_update'
);

-- 2. CORE KNOWLEDGE BASE TABLE
-- =====================================================

CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Core identification
  name TEXT NOT NULL,
  category public.knowledge_category NOT NULL,
  subcategory TEXT, -- flexible subcategory within main category
  
  -- Content and descriptions
  description TEXT,
  details JSONB DEFAULT '{}', -- flexible metadata storage
  
  -- Confidence and reliability
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  extraction_method public.extraction_method NOT NULL DEFAULT 'llm_direct',
  evidence TEXT, -- supporting evidence from source material
  reasoning TEXT, -- AI reasoning for extraction
  
  -- Source tracking
  source_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  source_paragraph_hash TEXT, -- specific paragraph this was extracted from
  source_text_excerpt TEXT, -- actual text excerpt for reference
  
  -- Flags and status
  is_flagged BOOLEAN DEFAULT FALSE, -- flagged for human review
  is_verified BOOLEAN DEFAULT FALSE, -- human verified
  review_notes TEXT, -- human review notes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- last time this fact was encountered
  
  -- Search and indexing
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(subcategory, ''))
  ) STORED
);

-- 3. CONTENT HASH TRACKING
-- =====================================================

CREATE TABLE public.content_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  
  -- Hash types
  original_content_hash TEXT NOT NULL, -- hash of original content
  enhanced_content_hash TEXT, -- hash of refined content
  paragraph_hashes JSONB NOT NULL DEFAULT '[]', -- array of paragraph-level hashes
  
  -- Processing metadata
  last_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_version TEXT DEFAULT '1.0', -- version of processing algorithm
  
  -- Change detection
  has_changes BOOLEAN DEFAULT FALSE,
  change_summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chapter_id)
);

-- 4. INDIVIDUAL FACTS TRACKING
-- =====================================================

CREATE TABLE public.knowledge_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  
  -- Fact details
  fact_key TEXT NOT NULL, -- structured key like "appearance.height" or "personality.primary_trait"
  fact_value TEXT NOT NULL,
  fact_type TEXT DEFAULT 'string', -- string, number, boolean, array, object
  
  -- Confidence and extraction
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  extraction_method public.extraction_method NOT NULL DEFAULT 'llm_direct',
  evidence TEXT,
  reasoning TEXT,
  
  -- Source tracking
  source_paragraph_hash TEXT,
  source_text_excerpt TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(knowledge_base_id, fact_key)
);

-- 5. PROCESSING JOBS TRACKING
-- =====================================================

CREATE TABLE public.knowledge_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE, -- NULL for full project analysis
  
  -- Job details
  job_type TEXT NOT NULL DEFAULT 'full_analysis', -- full_analysis, incremental_update, fact_extraction
  state public.processing_state DEFAULT 'pending',
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step TEXT, -- current processing step description
  total_steps INTEGER DEFAULT 1,
  completed_steps INTEGER DEFAULT 0,
  
  -- Processing metadata
  processing_options JSONB DEFAULT '{}',
  word_count INTEGER,
  estimated_duration_minutes INTEGER,
  
  -- Results and errors
  results_summary JSONB DEFAULT '{}',
  error_message TEXT,
  error_details JSONB,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CHANGE LOG FOR AUDIT TRAIL
-- =====================================================

CREATE TABLE public.knowledge_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  knowledge_fact_id UUID REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  
  -- Change details
  change_type public.change_type NOT NULL,
  field_changed TEXT, -- which field was modified
  old_value TEXT,
  new_value TEXT,
  
  -- Change metadata
  confidence_before NUMERIC(3,2),
  confidence_after NUMERIC(3,2),
  change_reason TEXT,
  
  -- Source tracking
  triggered_by_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  triggered_by_hash TEXT, -- content hash that triggered this change
  
  -- User or system change
  changed_by_user BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
-- =====================================================

-- Knowledge base indexes
CREATE INDEX idx_knowledge_base_project_id ON knowledge_base(project_id);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_confidence ON knowledge_base(confidence_score);
CREATE INDEX idx_knowledge_base_flagged ON knowledge_base(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX idx_knowledge_base_source_chapter ON knowledge_base(source_chapter_id);
CREATE INDEX idx_knowledge_base_search ON knowledge_base USING GIN(search_vector);
CREATE INDEX idx_knowledge_base_updated ON knowledge_base(updated_at DESC);

-- Content hashes indexes
CREATE INDEX idx_content_hashes_chapter_id ON content_hashes(chapter_id);
CREATE INDEX idx_content_hashes_changes ON content_hashes(has_changes) WHERE has_changes = TRUE;
CREATE INDEX idx_content_hashes_processed ON content_hashes(last_processed_at DESC);

-- Knowledge facts indexes
CREATE INDEX idx_knowledge_facts_knowledge_base_id ON knowledge_facts(knowledge_base_id);
CREATE INDEX idx_knowledge_facts_confidence ON knowledge_facts(confidence_score);
CREATE INDEX idx_knowledge_facts_key ON knowledge_facts(fact_key);

-- Processing jobs indexes (FIXED: correct table name)
CREATE INDEX idx_knowledge_processing_jobs_project_id ON knowledge_processing_jobs(project_id);
CREATE INDEX idx_knowledge_processing_jobs_state ON knowledge_processing_jobs(state);
CREATE INDEX idx_knowledge_processing_jobs_chapter_id ON knowledge_processing_jobs(chapter_id);
CREATE INDEX idx_knowledge_processing_jobs_started ON knowledge_processing_jobs(started_at DESC);

-- Change log indexes
CREATE INDEX idx_change_log_knowledge_base ON knowledge_change_log(knowledge_base_id);
CREATE INDEX idx_change_log_created ON knowledge_change_log(created_at DESC);
CREATE INDEX idx_change_log_change_type ON knowledge_change_log(change_type);

-- 8. DATABASE FUNCTIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-flag low confidence items
CREATE OR REPLACE FUNCTION auto_flag_low_confidence()
RETURNS TRIGGER AS $$
BEGIN
  -- Flag items with confidence < 0.5
  IF NEW.confidence_score < 0.50 THEN
    NEW.is_flagged = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log knowledge changes
CREATE OR REPLACE FUNCTION log_knowledge_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO knowledge_change_log (
    knowledge_base_id,
    change_type,
    field_changed,
    old_value,
    new_value,
    confidence_before,
    confidence_after,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'addition'::change_type
      WHEN TG_OP = 'UPDATE' THEN 'modification'::change_type
      WHEN TG_OP = 'DELETE' THEN 'deletion'::change_type
    END,
    'knowledge_base_record',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.name ELSE NULL END,
    CASE WHEN TG_OP != 'INSERT' THEN OLD.confidence_score ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.confidence_score ELSE NULL END,
    'Automated change logging'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate processing progress
CREATE OR REPLACE FUNCTION update_processing_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate progress percentage
  IF NEW.total_steps > 0 THEN
    NEW.progress_percentage = LEAST(100, (NEW.completed_steps * 100) / NEW.total_steps);
  END IF;
  
  -- Mark as done if 100% complete
  IF NEW.progress_percentage >= 100 AND NEW.state != 'done' AND NEW.state != 'failed' THEN
    NEW.state = 'done';
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGERS
-- =====================================================

-- Auto-update timestamps on knowledge_base
CREATE TRIGGER trigger_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_timestamp();

-- Auto-flag low confidence items
CREATE TRIGGER trigger_auto_flag_low_confidence
  BEFORE INSERT OR UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_low_confidence();

-- Log all knowledge changes
CREATE TRIGGER trigger_log_knowledge_changes
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION log_knowledge_change();

-- Update processing progress
CREATE TRIGGER trigger_update_processing_progress
  BEFORE UPDATE ON knowledge_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_processing_progress();

-- Auto-update timestamps on knowledge_facts
CREATE TRIGGER trigger_knowledge_facts_updated_at
  BEFORE UPDATE ON knowledge_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_timestamp();

-- Auto-update timestamps on content_hashes
CREATE TRIGGER trigger_content_hashes_updated_at
  BEFORE UPDATE ON content_hashes
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_timestamp();

-- 10. INITIAL DATA AND CONSTRAINTS
-- =====================================================

-- Add some helpful constraints
ALTER TABLE knowledge_base ADD CONSTRAINT valid_confidence_range 
  CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);

ALTER TABLE knowledge_facts ADD CONSTRAINT valid_fact_confidence_range 
  CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00);

-- Ensure processing jobs have valid progress
ALTER TABLE knowledge_processing_jobs ADD CONSTRAINT valid_progress_range
  CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Ensure completed steps don't exceed total steps
ALTER TABLE knowledge_processing_jobs ADD CONSTRAINT valid_step_counts
  CHECK (completed_steps <= total_steps);
