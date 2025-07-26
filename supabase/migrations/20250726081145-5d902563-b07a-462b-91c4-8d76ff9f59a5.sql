-- Clean slate for accurate diff-based change tracking
-- Remove all existing ai_change_tracking data as it uses incompatible position tracking
TRUNCATE TABLE public.ai_change_tracking;

-- Add indexes for better performance on the new dual-position system
CREATE INDEX IF NOT EXISTS idx_ai_change_tracking_refinement_positions 
ON public.ai_change_tracking (refinement_id, position_start, position_end);

-- Add comment to track migration purpose
COMMENT ON TABLE public.ai_change_tracking IS 'Stores character-level AI change tracking with dual position system (original and enhanced text coordinates)';