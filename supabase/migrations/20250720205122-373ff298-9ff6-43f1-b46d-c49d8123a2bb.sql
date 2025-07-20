
-- Fix the handle_new_user function to handle duplicate key violations
-- This addresses the "Database error saving new user" issue

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Extract user info for logging
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');
  
  RAISE NOTICE 'Starting user creation process for email: %', user_email;
  
  BEGIN
    -- Insert new profile record with conflict handling
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
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
    
    RAISE NOTICE 'Profile created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user profile: %', SQLERRM;
  END;
  
  BEGIN
    -- Create subscriber record with conflict handling
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
      'plume',  -- Ensure this matches the check constraint
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
    
    RAISE NOTICE 'Subscriber record created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating subscriber for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user subscription: %', SQLERRM;
  END;
  
  BEGIN
    -- Create usage tracking record with conflict handling (upsert)
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
      -- Only update if the existing record has default values (indicating incomplete signup)
      ai_credits_limit = CASE 
        WHEN usage_tracking.ai_credits_limit = 0 THEN 5 
        ELSE usage_tracking.ai_credits_limit 
      END,
      updated_at = NOW();
    
    RAISE NOTICE 'Usage tracking created/updated successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating usage tracking for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user tracking: %', SQLERRM;
  END;
  
  RAISE NOTICE 'User creation completed successfully for: %', user_email;
  RETURN NEW;
END;
$function$;

-- Clean up any orphaned records that might exist from failed signups
-- This helps prevent future conflicts
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check for usage_tracking records without corresponding auth users
  -- Note: We can't directly query auth.users, so we'll rely on the profiles table
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
END;
$$;
