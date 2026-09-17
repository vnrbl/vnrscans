-- Migration: Add missing profile columns (accent_color, banner_url, social links)
-- Fixes: "Could not find the 'accent_color' column of 'profiles' in the schema cache"

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS social_discord TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter TEXT,
  ADD COLUMN IF NOT EXISTS social_mal TEXT,
  ADD COLUMN IF NOT EXISTS social_anilist TEXT,
  ADD COLUMN IF NOT EXISTS social_website TEXT;

-- Ensure authenticated role can insert and update these columns
GRANT INSERT (
  accent_color,
  banner_url,
  social_discord,
  social_instagram,
  social_twitter,
  social_mal,
  social_anilist,
  social_website
) ON public.profiles TO authenticated;

GRANT UPDATE (
  accent_color,
  banner_url,
  social_discord,
  social_instagram,
  social_twitter,
  social_mal,
  social_anilist,
  social_website
) ON public.profiles TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
