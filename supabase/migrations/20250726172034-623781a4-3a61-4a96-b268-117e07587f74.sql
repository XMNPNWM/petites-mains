-- Update existing Plume users to have 15 AI credits instead of 5
UPDATE public.usage_tracking 
SET ai_credits_limit = 15
WHERE user_id IN (
  SELECT user_id 
  FROM public.subscribers 
  WHERE subscription_tier = 'plume' OR subscription_tier IS NULL
);

-- Update the handle_new_user function to give new Plume users 15 AI credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    -- Insert/update profile record
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
  END;
  
  BEGIN
    -- Insert/update subscriber record
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
    
    RAISE NOTICE 'Subscriber record created/updated for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating subscriber record for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  END;
  
  BEGIN
    -- Insert/update usage tracking record with improved AI credits for Plume users
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
      15, -- New Plume users get 15 AI credits instead of 5
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      ai_credits_limit = CASE 
        WHEN usage_tracking.ai_credits_limit = 5 THEN 15 -- Upgrade existing 5-credit users to 15
        ELSE usage_tracking.ai_credits_limit -- Keep existing limits for paid users
      END,
      updated_at = NOW()
    WHERE usage_tracking.user_id = NEW.id;
    
    RAISE NOTICE 'Usage tracking created/updated with 15 AI credits for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating usage tracking for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;