-- Add INSERT policy for profiles table
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
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
  
  -- Create subscriber record with Plume tier
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
    'Plume',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();