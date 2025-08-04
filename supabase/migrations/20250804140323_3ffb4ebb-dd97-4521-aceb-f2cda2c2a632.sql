-- Phase 3.4: Complete UUID Traceability Implementation
-- Add missing source_chapter_id fields and fix data types

-- Add source_chapter_id to character_relationships
ALTER TABLE public.character_relationships 
ADD COLUMN source_chapter_id UUID REFERENCES public.chapters(id);

-- Add source_chapter_id to plot_threads  
ALTER TABLE public.plot_threads 
ADD COLUMN source_chapter_id UUID REFERENCES public.chapters(id);

-- Add source_chapter_id to timeline_events
ALTER TABLE public.timeline_events 
ADD COLUMN source_chapter_id UUID REFERENCES public.chapters(id);

-- Add source_chapter_id to plot_points
ALTER TABLE public.plot_points 
ADD COLUMN source_chapter_id UUID REFERENCES public.chapters(id);

-- Fix chapter_summaries.source_chapter_id from TEXT to UUID
ALTER TABLE public.chapter_summaries 
ALTER COLUMN source_chapter_id TYPE UUID USING source_chapter_id::UUID;

-- Add source_chapter_ids JSONB array to chapter_summaries
ALTER TABLE public.chapter_summaries 
ADD COLUMN source_chapter_ids JSONB DEFAULT '[]'::jsonb;