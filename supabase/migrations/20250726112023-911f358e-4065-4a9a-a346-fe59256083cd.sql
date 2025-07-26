-- Phase 1: Database Schema Update for Enhanced Change Tracking
-- Add dual-position columns and clean up old data

-- Clear all existing change tracking data (user approved)
TRUNCATE TABLE public.ai_change_tracking CASCADE;

-- Remove old position columns
ALTER TABLE public.ai_change_tracking 
DROP COLUMN IF EXISTS position_start,
DROP COLUMN IF EXISTS position_end;

-- Add new dual-position columns (NOT NULL since we're starting fresh)
ALTER TABLE public.ai_change_tracking 
ADD COLUMN original_position_start INTEGER NOT NULL DEFAULT 0,
ADD COLUMN original_position_end INTEGER NOT NULL DEFAULT 0,
ADD COLUMN enhanced_position_start INTEGER NOT NULL DEFAULT 0,
ADD COLUMN enhanced_position_end INTEGER NOT NULL DEFAULT 0,
ADD COLUMN semantic_similarity NUMERIC,
ADD COLUMN semantic_impact TEXT CHECK (semantic_impact IN ('low', 'medium', 'high'));

-- Remove defaults after adding columns
ALTER TABLE public.ai_change_tracking 
ALTER COLUMN original_position_start DROP DEFAULT,
ALTER COLUMN original_position_end DROP DEFAULT,
ALTER COLUMN enhanced_position_start DROP DEFAULT,
ALTER COLUMN enhanced_position_end DROP DEFAULT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_change_tracking_dual_positions 
ON public.ai_change_tracking(original_position_start, original_position_end, enhanced_position_start, enhanced_position_end);

-- Add constraint to ensure position integrity
ALTER TABLE public.ai_change_tracking 
ADD CONSTRAINT check_position_integrity 
CHECK (
  original_position_start >= 0 AND 
  original_position_end >= original_position_start AND
  enhanced_position_start >= 0 AND 
  enhanced_position_end >= enhanced_position_start
);