
-- Update the Plume tier to have 5 AI credits as mentioned in Help Center
UPDATE public.subscribers 
SET subscription_tier = 'plume' 
WHERE subscription_tier = 'Plume';

-- Add a function to reset monthly AI credits (this will be called by a scheduled task)
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reset AI credits for all users based on their subscription tier
  UPDATE public.usage_tracking 
  SET 
    ai_credits_used = 0,
    updated_at = now()
  WHERE true;
  
  RAISE NOTICE 'Monthly AI credits have been reset for all users';
END;
$$;

-- Add a function to get user's remaining AI credits
CREATE OR REPLACE FUNCTION public.get_user_ai_credits(user_uuid uuid)
RETURNS TABLE(
  credits_used integer,
  credits_limit integer,
  credits_remaining integer,
  subscription_tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ut.ai_credits_used,
    ut.ai_credits_limit,
    GREATEST(0, ut.ai_credits_limit - ut.ai_credits_used) as credits_remaining,
    s.subscription_tier
  FROM public.usage_tracking ut
  JOIN public.subscribers s ON s.user_id = ut.user_id
  WHERE ut.user_id = user_uuid;
END;
$$;

-- Add a function to deduct AI credits
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(user_uuid uuid, credits_to_deduct integer)
RETURNS TABLE(
  success boolean,
  remaining_credits integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_used integer;
  current_limit integer;
  user_tier text;
BEGIN
  -- Get current usage and limits
  SELECT ut.ai_credits_used, ut.ai_credits_limit, s.subscription_tier
  INTO current_used, current_limit, user_tier
  FROM public.usage_tracking ut
  JOIN public.subscribers s ON s.user_id = ut.user_id
  WHERE ut.user_id = user_uuid;
  
  -- Check if user exists
  IF current_used IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found';
    RETURN;
  END IF;
  
  -- Check if user has enough credits
  IF (current_used + credits_to_deduct) > current_limit THEN
    RETURN QUERY SELECT false, GREATEST(0, current_limit - current_used), 'Insufficient AI credits';
    RETURN;
  END IF;
  
  -- Deduct credits
  UPDATE public.usage_tracking 
  SET 
    ai_credits_used = ai_credits_used + credits_to_deduct,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Return success
  RETURN QUERY SELECT true, GREATEST(0, current_limit - current_used - credits_to_deduct), NULL::text;
END;
$$;

-- Update usage tracking to ensure Plume tier has 5 credits limit (not 0)
UPDATE public.usage_tracking 
SET ai_credits_limit = 5 
WHERE user_id IN (
  SELECT user_id FROM public.subscribers WHERE subscription_tier = 'plume'
) AND ai_credits_limit = 0;
