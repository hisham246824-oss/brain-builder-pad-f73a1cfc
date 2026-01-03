-- Fix: Allow public reading of profiles for video display
-- This is needed so that video publisher names show correctly for all users

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy allowing anyone to view profiles (public data only)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);