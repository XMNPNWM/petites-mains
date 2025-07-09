-- Phase 3: Chronological Coordination - Database Schema Enhancements

-- Add chronological coordination fields to plot_points table
ALTER TABLE public.plot_points 
ADD COLUMN IF NOT EXISTS chronological_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS narrative_sequence_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS temporal_markers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependency_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chronological_confidence NUMERIC DEFAULT 0.5;

-- Add chronological coordination fields to plot_threads table  
ALTER TABLE public.plot_threads
ADD COLUMN IF NOT EXISTS chronological_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS narrative_sequence_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS temporal_markers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependency_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chronological_confidence NUMERIC DEFAULT 0.5;

-- Add chronological coordination fields to character_relationships table
ALTER TABLE public.character_relationships
ADD COLUMN IF NOT EXISTS chronological_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS narrative_sequence_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS temporal_markers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependency_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chronological_confidence NUMERIC DEFAULT 0.5;

-- Add chronological coordination fields to chapter_summaries table
ALTER TABLE public.chapter_summaries
ADD COLUMN IF NOT EXISTS chronological_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS narrative_sequence_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS temporal_markers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependency_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chronological_confidence NUMERIC DEFAULT 0.5;

-- Enhance timeline_events table with additional coordination fields
ALTER TABLE public.timeline_events
ADD COLUMN IF NOT EXISTS narrative_sequence_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS temporal_markers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependency_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chronological_confidence NUMERIC DEFAULT 0.5;

-- Create indexes for performance on chronological queries
CREATE INDEX IF NOT EXISTS idx_plot_points_chronological ON public.plot_points(project_id, chronological_order);
CREATE INDEX IF NOT EXISTS idx_plot_threads_chronological ON public.plot_threads(project_id, chronological_order);
CREATE INDEX IF NOT EXISTS idx_timeline_events_chronological ON public.timeline_events(project_id, chronological_order);
CREATE INDEX IF NOT EXISTS idx_character_relationships_chronological ON public.character_relationships(project_id, chronological_order);
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_chronological ON public.chapter_summaries(project_id, chronological_order);

-- Create indexes for narrative sequence grouping
CREATE INDEX IF NOT EXISTS idx_plot_points_narrative_sequence ON public.plot_points(project_id, narrative_sequence_id) WHERE narrative_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plot_threads_narrative_sequence ON public.plot_threads(project_id, narrative_sequence_id) WHERE narrative_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_events_narrative_sequence ON public.timeline_events(project_id, narrative_sequence_id) WHERE narrative_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_character_relationships_narrative_sequence ON public.character_relationships(project_id, narrative_sequence_id) WHERE narrative_sequence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_narrative_sequence ON public.chapter_summaries(project_id, narrative_sequence_id) WHERE narrative_sequence_id IS NOT NULL;

-- Create function to assign chronological order automatically
CREATE OR REPLACE FUNCTION public.assign_chronological_order(p_project_id UUID)
RETURNS TABLE(elements_processed INTEGER, sequences_created INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  element_count INT := 0;
  sequence_count INT := 0;
  current_order INT := 1;
BEGIN
  -- This function will be enhanced in the application logic
  -- For now, it provides a foundation for chronological coordination
  
  -- Update timeline events first (they often drive the narrative)
  UPDATE public.timeline_events 
  SET chronological_order = ROW_NUMBER() OVER (
    PARTITION BY project_id 
    ORDER BY COALESCE(chronological_order, 0), created_at
  )
  WHERE project_id = p_project_id;
  
  GET DIAGNOSTICS element_count = ROW_COUNT;
  
  -- Update plot points based on timeline events
  UPDATE public.plot_points 
  SET chronological_order = ROW_NUMBER() OVER (
    PARTITION BY project_id 
    ORDER BY COALESCE(chronological_order, 0), created_at
  )
  WHERE project_id = p_project_id;
  
  -- Update plot threads
  UPDATE public.plot_threads 
  SET chronological_order = ROW_NUMBER() OVER (
    PARTITION BY project_id 
    ORDER BY COALESCE(chronological_order, 0), created_at
  )
  WHERE project_id = p_project_id;
  
  -- Update character relationships
  UPDATE public.character_relationships 
  SET chronological_order = ROW_NUMBER() OVER (
    PARTITION BY project_id 
    ORDER BY COALESCE(chronological_order, 0), created_at
  )
  WHERE project_id = p_project_id;
  
  -- Update chapter summaries
  UPDATE public.chapter_summaries 
  SET chronological_order = ROW_NUMBER() OVER (
    PARTITION BY project_id 
    ORDER BY COALESCE(chronological_order, 0), created_at
  )
  WHERE project_id = p_project_id;
  
  RETURN QUERY SELECT element_count, sequence_count;
END;
$$;