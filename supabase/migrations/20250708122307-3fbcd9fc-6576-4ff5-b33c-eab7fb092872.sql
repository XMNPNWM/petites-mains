-- Fix chapter_summaries table for proper knowledge extraction
-- Add unique constraint to prevent duplicate summaries per chapter
ALTER TABLE public.chapter_summaries 
ADD CONSTRAINT chapter_summaries_project_chapter_unique 
UNIQUE (project_id, chapter_id);

-- Ensure chapter_id is properly typed and not nullable for new records
-- (existing records may have null chapter_id, which is fine for backwards compatibility)

-- Add index for better performance on project queries
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_project_id 
ON public.chapter_summaries (project_id);

-- Add index for better performance on chapter queries  
CREATE INDEX IF NOT EXISTS idx_chapter_summaries_chapter_id 
ON public.chapter_summaries (chapter_id);

-- Update the plot_points table to ensure proper flagging capability
ALTER TABLE public.plot_points 
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;

-- Update the plot_threads table to ensure proper flagging capability  
ALTER TABLE public.plot_threads
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;

-- Update the timeline_events table to ensure proper flagging capability
ALTER TABLE public.timeline_events
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;