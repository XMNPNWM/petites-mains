-- Phase 1: Fix Critical Subscribers Table Security Vulnerabilities

-- Remove the dangerous policies that allow anyone to insert/update any subscription data
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure policies for subscribers table
-- Only allow service functions to manage subscription data (they use service role key)
CREATE POLICY "Service can insert subscriptions" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (false); -- Block all direct inserts, only service functions can insert

CREATE POLICY "Service can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
USING (false); -- Block all direct updates, only service functions can update

-- Keep the existing secure SELECT policy (already properly restricts to user's own data)
-- "Users can view their own subscription" policy remains unchanged

-- Phase 2: Secure Usage Tracking System Access

-- Remove overly broad system update policy
DROP POLICY IF EXISTS "System can update usage tracking" ON public.usage_tracking;

-- Create more restrictive system policy that only allows service role operations
CREATE POLICY "Service can manage usage tracking" 
ON public.usage_tracking 
FOR ALL 
USING (false) 
WITH CHECK (false); -- Block all direct operations, only service functions can manage

-- Keep existing user policies for viewing their own data
-- Other user-specific policies remain unchanged

-- Phase 3: Add logging to track policy usage (for verification)
COMMENT ON POLICY "Service can insert subscriptions" ON public.subscribers IS 'Blocks direct inserts - only edge functions with service role can manage subscriptions';
COMMENT ON POLICY "Service can update subscriptions" ON public.subscribers IS 'Blocks direct updates - only edge functions with service role can manage subscriptions';
COMMENT ON POLICY "Service can manage usage tracking" ON public.usage_tracking IS 'Blocks direct operations - only edge functions with service role can manage usage tracking';