-- =========================================================
-- USER LIBRARY - Reading Status Tracking
-- =========================================================
CREATE TYPE public.reading_status AS ENUM ('reading', 'completed', 'plan_to_read', 'dropped');

CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  reading_status public.reading_status NOT NULL DEFAULT 'reading',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;
GRANT ALL ON public.user_library TO service_role;

-- Enable RLS
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Policies: users can only manage their own library entries
CREATE POLICY "user_library self manage" ON public.user_library 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all library entries
CREATE POLICY "user_library admin view" ON public.user_library 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX user_library_user_idx ON public.user_library(user_id, updated_at DESC);
CREATE INDEX user_library_series_idx ON public.user_library(series_id);
CREATE INDEX user_library_status_idx ON public.user_library(user_id, reading_status);
