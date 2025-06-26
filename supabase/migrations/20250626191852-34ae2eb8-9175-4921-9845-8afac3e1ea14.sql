
-- Enable the pgvector extension for embeddings support
CREATE EXTENSION IF NOT EXISTS vector;

-- Create character_relationships table
CREATE TABLE public.character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  character_a_id UUID REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  character_b_id UUID REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  character_a_name TEXT NOT NULL,
  character_b_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  relationship_strength INTEGER NOT NULL DEFAULT 1,
  strength_history JSONB DEFAULT '[]'::jsonb,
  key_interactions JSONB DEFAULT '[]'::jsonb,
  relationship_start_chapter_id UUID REFERENCES public.chapters(id),
  relationship_current_status TEXT DEFAULT 'active',
  confidence_score NUMERIC DEFAULT 0.50,
  extraction_method extraction_method DEFAULT 'llm_direct',
  evidence TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plot_threads table
CREATE TABLE public.plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  thread_name TEXT NOT NULL,
  thread_type TEXT NOT NULL,
  key_events JSONB DEFAULT '[]'::jsonb,
  thread_status TEXT DEFAULT 'active',
  start_chapter_id UUID REFERENCES public.chapters(id),
  end_chapter_id UUID REFERENCES public.chapters(id),
  resolution_status TEXT,
  confidence_score NUMERIC DEFAULT 0.50,
  extraction_method extraction_method DEFAULT 'llm_direct',
  evidence TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create timeline_events table
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  chronological_order INTEGER NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id),
  event_date_in_story TEXT,
  duration_description TEXT,
  characters_involved JSONB DEFAULT '[]'::jsonb,
  locations_involved JSONB DEFAULT '[]'::jsonb,
  plot_threads_affected JSONB DEFAULT '[]'::jsonb,
  event_importance TEXT DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0.50,
  extraction_method extraction_method DEFAULT 'llm_direct',
  evidence TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conflict_tracking table
CREATE TABLE public.conflict_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conflict_name TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  conflict_description TEXT,
  current_intensity INTEGER DEFAULT 1,
  intensity_history JSONB DEFAULT '[]'::jsonb,
  characters_involved JSONB DEFAULT '[]'::jsonb,
  start_chapter_id UUID REFERENCES public.chapters(id),
  resolution_chapter_id UUID REFERENCES public.chapters(id),
  resolution_status TEXT DEFAULT 'unresolved',
  escalation_points JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC DEFAULT 0.50,
  extraction_method extraction_method DEFAULT 'llm_direct',
  evidence TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create semantic_chunks table
CREATE TABLE public.semantic_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  embeddings VECTOR(1536), -- For OpenAI text-embedding-3-small
  embeddings_model TEXT DEFAULT 'text-embedding-3-small',
  named_entities JSONB DEFAULT '[]'::jsonb,
  entity_types JSONB DEFAULT '[]'::jsonb,
  discourse_markers JSONB DEFAULT '[]'::jsonb,
  dialogue_present BOOLEAN DEFAULT false,
  dialogue_speakers JSONB DEFAULT '[]'::jsonb,
  breakpoint_score NUMERIC NOT NULL,
  breakpoint_reasons JSONB DEFAULT '[]'::jsonb,
  overlap_with_previous BOOLEAN DEFAULT false,
  overlap_with_next BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processing_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_character_relationships_project_id ON public.character_relationships(project_id);
CREATE INDEX idx_character_relationships_strength ON public.character_relationships(relationship_strength DESC);
CREATE INDEX idx_plot_threads_project_id ON public.plot_threads(project_id);
CREATE INDEX idx_plot_threads_status ON public.plot_threads(thread_status);
CREATE INDEX idx_timeline_events_project_id ON public.timeline_events(project_id);
CREATE INDEX idx_timeline_events_chronological ON public.timeline_events(chronological_order);
CREATE INDEX idx_conflict_tracking_project_id ON public.conflict_tracking(project_id);
CREATE INDEX idx_conflict_tracking_intensity ON public.conflict_tracking(current_intensity DESC);
CREATE INDEX idx_semantic_chunks_chapter_id ON public.semantic_chunks(chapter_id);
CREATE INDEX idx_semantic_chunks_project_id ON public.semantic_chunks(project_id);
CREATE INDEX idx_semantic_chunks_chunk_index ON public.semantic_chunks(chunk_index);

-- Create vector similarity index for embeddings
CREATE INDEX idx_semantic_chunks_embeddings ON public.semantic_chunks USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Enable RLS on all tables
ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can access data for their own projects)
CREATE POLICY "Users can access their own character relationships" ON public.character_relationships
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their own plot threads" ON public.plot_threads
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their own timeline events" ON public.timeline_events
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their own conflict tracking" ON public.conflict_tracking
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their own semantic chunks" ON public.semantic_chunks
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_character_relationships_updated_at BEFORE UPDATE ON public.character_relationships FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_plot_threads_updated_at BEFORE UPDATE ON public.plot_threads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON public.timeline_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conflict_tracking_updated_at BEFORE UPDATE ON public.conflict_tracking FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_semantic_chunks_updated_at BEFORE UPDATE ON public.semantic_chunks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
