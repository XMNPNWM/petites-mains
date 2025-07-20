
-- Fix the handle_new_user function to use lowercase 'plume' instead of 'Plume'
-- This will resolve the check constraint violation preventing new user signups

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
  
  -- Create subscriber record with lowercase 'plume' tier (was 'Plume')
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
    'plume',  -- Changed from 'Plume' to 'plume' to match constraint
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$function$;
