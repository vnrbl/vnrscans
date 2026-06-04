-- Migration to add avatar_frame to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_frame TEXT DEFAULT 'none';
