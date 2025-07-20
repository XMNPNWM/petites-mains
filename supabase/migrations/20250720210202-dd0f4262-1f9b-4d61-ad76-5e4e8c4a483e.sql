
-- Add missing unique constraint on subscribers.user_id to fix the handle_new_user function
-- This will allow the ON CONFLICT (user_id) clause to work properly

ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_user_id_key UNIQUE (user_id);

-- Verify that profiles table has the correct primary key constraint (it should already exist)
-- The profiles table uses 'id' as primary key which references auth.users(id)

-- Verify that usage_tracking has the correct unique constraint (it should already exist)  
-- The usage_tracking table should have a unique constraint on user_id
DO $$
BEGIN
  -- Check if usage_tracking has a unique constraint on user_id, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'usage_tracking_user_id_key' 
    AND table_name = 'usage_tracking'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.usage_tracking ADD CONSTRAINT usage_tracking_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint to usage_tracking.user_id';
  ELSE
    RAISE NOTICE 'usage_tracking.user_id unique constraint already exists';
  END IF;
END $$;
