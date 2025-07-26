-- Add foreign key constraint for better data integrity and cross-chapter protection
ALTER TABLE public.ai_change_tracking 
ADD CONSTRAINT fk_ai_change_tracking_refinement 
FOREIGN KEY (refinement_id) REFERENCES public.chapter_refinements(id) 
ON DELETE CASCADE;

-- Update refinement status enum to include 'failed' state
ALTER TABLE public.chapter_refinements 
DROP CONSTRAINT IF EXISTS chapter_refinements_refinement_status_check;

ALTER TABLE public.chapter_refinements 
ADD CONSTRAINT chapter_refinements_refinement_status_check 
CHECK (refinement_status IN ('untouched', 'in_progress', 'completed', 'failed'));

-- Add index for better performance on cleanup queries
CREATE INDEX IF NOT EXISTS idx_chapter_refinements_status_updated 
ON public.chapter_refinements(refinement_status, updated_at) 
WHERE refinement_status = 'in_progress';