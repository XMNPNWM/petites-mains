-- Add timestamp and batch tracking to ai_change_tracking table
ALTER TABLE public.ai_change_tracking 
ADD COLUMN processing_batch_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN created_at_enhanced TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add last enhancement timestamp to chapter_refinements table  
ALTER TABLE public.chapter_refinements
ADD COLUMN last_enhancement_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN current_batch_id UUID DEFAULT gen_random_uuid();

-- Create index for efficient batch queries
CREATE INDEX idx_ai_change_tracking_batch_id ON public.ai_change_tracking(processing_batch_id);
CREATE INDEX idx_ai_change_tracking_refinement_batch ON public.ai_change_tracking(refinement_id, processing_batch_id);
CREATE INDEX idx_chapter_refinements_batch_id ON public.chapter_refinements(current_batch_id);