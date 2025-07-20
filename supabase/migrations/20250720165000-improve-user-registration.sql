
-- Improve the handle_new_user function with better error handling and logging
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
    -- Insert new profile record
    INSERT INTO public.profiles (id, full_name, bio, avatar_url, created_at, updated_at)
    VALUES (
      NEW.id,
      user_name,
      NULL,
      NULL,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user profile: %', SQLERRM;
  END;
  
  BEGIN
    -- Create subscriber record with lowercase 'plume' tier
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
    );
    
    RAISE NOTICE 'Subscriber record created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating subscriber for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user subscription: %', SQLERRM;
  END;
  
  BEGIN
    -- Create usage tracking record with 5 AI credits for Plume users
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
    );
    
    RAISE NOTICE 'Usage tracking created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating usage tracking for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user tracking: %', SQLERRM;
  END;
  
  RAISE NOTICE 'User creation completed successfully for: %', user_email;
  RETURN NEW;
END;
$function$;

-- Verify the subscription_tier constraint is correct
DO $$
BEGIN
  -- Check if the constraint exists and what values it allows
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%subscription_tier%'
  ) THEN
    RAISE NOTICE 'Subscription tier constraint exists';
  ELSE
    RAISE NOTICE 'No subscription tier constraint found';
  END IF;
END
$$;
