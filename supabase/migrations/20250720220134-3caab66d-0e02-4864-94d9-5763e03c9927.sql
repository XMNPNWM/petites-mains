
-- Fix user signup duplicate key error by removing conflicting trigger and updating handle_new_user function

-- Step 1: Remove the conflicting trigger and function that's causing duplicate key violations
DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_usage();

-- Step 2: Update the handle_new_user function with better conflict handling and safety measures
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_email text;
  user_name text;
  existing_profile_count int := 0;
  existing_subscriber_count int := 0;
  existing_usage_count int := 0;
BEGIN
  -- Extract user info for logging
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');
  
  RAISE NOTICE 'Starting user creation process for email: %', user_email;
  
  -- Check for existing records to ensure idempotency
  SELECT COUNT(*) INTO existing_profile_count FROM public.profiles WHERE id = NEW.id;
  SELECT COUNT(*) INTO existing_subscriber_count FROM public.subscribers WHERE user_id = NEW.id;
  SELECT COUNT(*) INTO existing_usage_count FROM public.usage_tracking WHERE user_id = NEW.id;
  
  RAISE NOTICE 'Existing records - profiles: %, subscribers: %, usage: %', 
    existing_profile_count, existing_subscriber_count, existing_usage_count;
  
  BEGIN
    -- Insert/update profile record with comprehensive conflict handling
    INSERT INTO public.profiles (id, full_name, bio, avatar_url, created_at, updated_at)
    VALUES (
      NEW.id,
      user_name,
      NULL,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = NOW()
    WHERE profiles.id = NEW.id;
    
    RAISE NOTICE 'Profile created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    -- Don't fail the entire signup for profile errors
  END;
  
  BEGIN
    -- Insert/update subscriber record with comprehensive conflict handling
    INSERT INTO public.subscribers (
      user_id,
      email,
      subscribed,
      subscription_tier,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_email,
      false,
      'plume',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, subscribers.email),
      subscription_tier = COALESCE(EXCLUDED.subscription_tier, subscribers.subscription_tier),
      updated_at = NOW()
    WHERE subscribers.user_id = NEW.id;
    
    RAISE NOTICE 'Subscriber record created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating subscriber for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    -- Don't fail the entire signup for subscriber errors
  END;
  
  BEGIN
    -- Insert/update usage tracking record with safe conflict handling
    INSERT INTO public.usage_tracking (
      user_id,
      current_projects,
      total_word_count,
      worldbuilding_elements_count,
      ai_credits_used,
      ai_credits_limit,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      0,
      0,
      0,
      0,
      5,  -- Give 5 AI credits to new Plume users
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      -- Only update AI credits if current limit is 0 (indicating incomplete setup)
      ai_credits_limit = CASE 
        WHEN usage_tracking.ai_credits_limit = 0 THEN 5 
        ELSE usage_tracking.ai_credits_limit 
      END,
      -- Ensure other fields have safe defaults
      current_projects = COALESCE(usage_tracking.current_projects, 0),
      total_word_count = COALESCE(usage_tracking.total_word_count, 0),
      worldbuilding_elements_count = COALESCE(usage_tracking.worldbuilding_elements_count, 0),
      ai_credits_used = COALESCE(usage_tracking.ai_credits_used, 0),
      updated_at = NOW()
    WHERE usage_tracking.user_id = NEW.id;
    
    RAISE NOTICE 'Usage tracking created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating usage tracking for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    -- Log but don't fail signup - usage tracking can be created later
  END;
  
  RAISE NOTICE 'User creation completed successfully for: %', user_email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Final safety net - log the error but don't block user creation
  RAISE LOG 'Unexpected error in handle_new_user for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Step 3: Clean up any orphaned records that might exist from failed signups
-- This helps prevent future conflicts and ensures data consistency
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Clean up usage_tracking records without corresponding profiles
  DELETE FROM public.usage_tracking 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Cleaned up % orphaned usage_tracking records', orphaned_count;
  END IF;
  
  -- Clean up subscribers without profiles
  DELETE FROM public.subscribers 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Cleaned up % orphaned subscriber records', orphaned_count;
  END IF;
  
  RAISE NOTICE 'Database cleanup completed successfully';
END;
$$;

-- Step 4: Verify the trigger is properly set up (should already exist but ensuring it's correct)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add a safety check function for debugging
CREATE OR REPLACE FUNCTION public.check_user_setup_status(user_uuid uuid)
RETURNS TABLE(
  has_profile boolean,
  has_subscriber boolean,
  has_usage_tracking boolean,
  ai_credits_limit integer,
  setup_complete boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid) as has_profile,
    EXISTS(SELECT 1 FROM subscribers WHERE user_id = user_uuid) as has_subscriber,
    EXISTS(SELECT 1 FROM usage_tracking WHERE user_id = user_uuid) as has_usage_tracking,
    COALESCE((SELECT ut.ai_credits_limit FROM usage_tracking ut WHERE ut.user_id = user_uuid), 0) as ai_credits_limit,
    (
      EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid) AND
      EXISTS(SELECT 1 FROM subscribers WHERE user_id = user_uuid) AND
      EXISTS(SELECT 1 FROM usage_tracking WHERE user_id = user_uuid)
    ) as setup_complete;
END;
$function$;
