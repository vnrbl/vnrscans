-- Fix achievements table - add missing columns if they don't exist
ALTER TABLE public.achievements 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.achievements 
  ADD COLUMN IF NOT EXISTS is_secret boolean NOT NULL DEFAULT false;

-- Drop and recreate the policy with correct columns
DROP POLICY IF EXISTS "Achievements are public" ON public.achievements;

CREATE POLICY "Achievements are public" 
  ON public.achievements 
  FOR SELECT 
  USING (is_active = true AND is_secret = false);
