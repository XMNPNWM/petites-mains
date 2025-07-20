
-- Update existing Plume users to have 5 AI credits limit
UPDATE public.usage_tracking 
SET ai_credits_limit = 5 
WHERE user_id IN (
  SELECT user_id FROM public.subscribers WHERE subscription_tier = 'plume'
) AND ai_credits_limit = 0;

-- Update the handle_new_user function to assign 5 AI credits to new Plume users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert new profile record
  INSERT INTO public.profiles (id, full_name, bio, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULL,
    NULL,
    NOW(),
    NOW()
  );
  
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
    NEW.email,
    false,
    'plume',
    NOW(),
    NOW()
  );
  
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
  
  RETURN NEW;
END;
$function$;
