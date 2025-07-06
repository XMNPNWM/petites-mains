
-- Step 1: Database Schema Updates

-- Create chapter_summaries table
CREATE TABLE public.chapter_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL,
  project_id UUID NOT NULL,
  title TEXT,
  summary_short TEXT,
  summary_long TEXT,
  key_events_in_chapter JSONB DEFAULT '[]'::jsonb,
  primary_focus JSONB DEFAULT '[]'::jsonb,
  ai_confidence NUMERIC DEFAULT 0.5,
  source_chapter_id TEXT,
  is_newly_extracted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plot_points table  
CREATE TABLE public.plot_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  plot_thread_name TEXT,
  significance TEXT,
  characters_involved_names JSONB DEFAULT '[]'::jsonb,
  ai_confidence NUMERIC DEFAULT 0.5,
  source_chapter_ids JSONB DEFAULT '[]'::jsonb,
  is_newly_extracted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add metadata fields to existing tables
ALTER TABLE public.knowledge_base 
ADD COLUMN IF NOT EXISTS source_chapter_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_newly_extracted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_confidence_new NUMERIC DEFAULT 0.5;

ALTER TABLE public.character_relationships
ADD COLUMN IF NOT EXISTS source_character_name TEXT,
ADD COLUMN IF NOT EXISTS target_character_name TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_new NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS source_chapter_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_newly_extracted BOOLEAN DEFAULT true;

ALTER TABLE public.plot_threads
ADD COLUMN IF NOT EXISTS characters_involved_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS key_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_confidence_new NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS source_chapter_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_newly_extracted BOOLEAN DEFAULT true;

ALTER TABLE public.timeline_events
ADD COLUMN IF NOT EXISTS event_summary TEXT,
ADD COLUMN IF NOT EXISTS date_or_time_reference TEXT,
ADD COLUMN IF NOT EXISTS significance TEXT,
ADD COLUMN IF NOT EXISTS characters_involved_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS plot_threads_impacted_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS locations_involved_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_confidence_new NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS source_chapter_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_newly_extracted BOOLEAN DEFAULT true;

-- Add RLS policies for new tables
ALTER TABLE public.chapter_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_points ENABLE ROW LEVEL SECURITY;

-- Chapter summaries policies
CREATE POLICY "Users can access their own chapter summaries"
  ON public.chapter_summaries
  FOR ALL
  USING (project_id IN (
    SELECT projects.id FROM projects WHERE projects.user_id = auth.uid()
  ));

-- Plot points policies  
CREATE POLICY "Users can access their own plot points"
  ON public.plot_points
  FOR ALL
  USING (project_id IN (
    SELECT projects.id FROM projects WHERE projects.user_id = auth.uid()
  ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_project_id ON public.chapter_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_chapter_id ON public.chapter_summaries(chapter_id);
CREATE INDEX IF NOT EXISTS idx_plot_points_project_id ON public.plot_points(project_id);
