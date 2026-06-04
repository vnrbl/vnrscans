-- Profile Customization: Avatar Frame Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/edvqhmvqbtujzcfqkrbe/sql

-- 1. Add avatar_frame column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_frame TEXT DEFAULT 'none';
