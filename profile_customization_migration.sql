-- Profile Customization Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/edvqhmvqbtujzcfqkrbe/sql

-- 1. Add new columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS social_discord TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter TEXT,
  ADD COLUMN IF NOT EXISTS social_mal TEXT,
  ADD COLUMN IF NOT EXISTS social_anilist TEXT,
  ADD COLUMN IF NOT EXISTS social_website TEXT;

-- 2. Allow public read access to profiles for public profile pages
-- (Users can only update their own profile)
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Create banners storage bucket (if not exists)
-- NOTE: You also need to create this bucket in Supabase Dashboard:
--   Storage → New Bucket → Name: "banners" → Public: Yes → File size limit: 5MB
-- The SQL below sets up the storage policies:

-- Allow authenticated users to upload banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view banners
CREATE POLICY IF NOT EXISTS "Banner images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Allow authenticated users to upload banners
CREATE POLICY IF NOT EXISTS "Authenticated users can upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Allow users to update their own banners
CREATE POLICY IF NOT EXISTS "Users can update own banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Allow users to delete their own banners
CREATE POLICY IF NOT EXISTS "Users can delete own banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
