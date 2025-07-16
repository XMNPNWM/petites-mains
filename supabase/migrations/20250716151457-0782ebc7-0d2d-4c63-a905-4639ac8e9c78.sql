-- Create missing usage tracking triggers and fix current data

-- First, create the missing triggers for proper usage tracking

-- Trigger for project count (already exists but let's ensure it works)
-- This trigger is already defined, but let's make sure it works properly

-- Trigger for word count tracking on chapters
CREATE OR REPLACE FUNCTION public.update_word_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  project_user_id UUID;
  old_word_count INTEGER := 0;
  new_word_count INTEGER := 0;
  word_diff INTEGER := 0;
BEGIN
  -- Get the user_id from the project
  SELECT user_id INTO project_user_id FROM public.projects WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  IF TG_OP = 'INSERT' THEN
    new_word_count := COALESCE(NEW.word_count, 0);
    word_diff := new_word_count;
  ELSIF TG_OP = 'UPDATE' THEN
    old_word_count := COALESCE(OLD.word_count, 0);
    new_word_count := COALESCE(NEW.word_count, 0);
    word_diff := new_word_count - old_word_count;
  ELSIF TG_OP = 'DELETE' THEN
    old_word_count := COALESCE(OLD.word_count, 0);
    word_diff := -old_word_count;
  END IF;

  -- Update usage tracking
  INSERT INTO public.usage_tracking (user_id, total_word_count)
  VALUES (project_user_id, word_diff)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_word_count = GREATEST(0, public.usage_tracking.total_word_count + word_diff),
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for word count updates
DROP TRIGGER IF EXISTS trigger_update_word_count ON public.chapters;
CREATE TRIGGER trigger_update_word_count
  AFTER INSERT OR UPDATE OR DELETE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_word_count();

-- Function to recalculate and fix all current usage data
CREATE OR REPLACE FUNCTION public.recalculate_all_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update usage tracking with correct counts for all users
  INSERT INTO public.usage_tracking (
    user_id,
    current_projects,
    total_word_count,
    worldbuilding_elements_count,
    updated_at
  )
  SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as current_projects,
    COALESCE(SUM(c.word_count), 0) as total_word_count,
    COUNT(DISTINCT we.id) as worldbuilding_elements_count,
    now() as updated_at
  FROM public.projects p
  LEFT JOIN public.chapters c ON c.project_id = p.id
  LEFT JOIN public.worldbuilding_elements we ON we.project_id = p.id
  GROUP BY p.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_projects = EXCLUDED.current_projects,
    total_word_count = EXCLUDED.total_word_count,
    worldbuilding_elements_count = EXCLUDED.worldbuilding_elements_count,
    updated_at = EXCLUDED.updated_at;
    
  RAISE NOTICE 'Usage tracking data recalculated for all users';
END;
$function$;

-- Run the recalculation to fix current data
SELECT public.recalculate_all_usage();

-- Add usage_tracking table if it doesn't exist (it should exist but let's be safe)
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_projects INTEGER DEFAULT 0,
  total_word_count INTEGER DEFAULT 0,
  worldbuilding_elements_count INTEGER DEFAULT 0,
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on usage_tracking if not already enabled
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own usage
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for system to update usage
DROP POLICY IF EXISTS "System can update usage tracking" ON public.usage_tracking;
CREATE POLICY "System can update usage tracking" ON public.usage_tracking
FOR ALL
USING (true);