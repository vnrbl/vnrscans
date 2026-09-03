-- Migration: Add source_url, estimated_next_release_at, and unlock delay support
-- 1. Add source_url to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 2. Add estimated release timing columns to series_import_sources
ALTER TABLE public.series_import_sources ADD COLUMN IF NOT EXISTS estimated_next_release_at TIMESTAMPTZ;
ALTER TABLE public.series_import_sources ADD COLUMN IF NOT EXISTS release_cadence TEXT;
ALTER TABLE public.series_import_sources ADD COLUMN IF NOT EXISTS last_scanned_timing_at TIMESTAMPTZ;

-- 3. Add estimated release timing columns to series
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS estimated_next_release_at TIMESTAMPTZ;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS release_cadence TEXT;

-- Create index on estimated_next_release_at for fast scheduled checks
CREATE INDEX IF NOT EXISTS idx_series_import_sources_scheduled_check 
  ON public.series_import_sources(enabled, estimated_next_release_at);

CREATE INDEX IF NOT EXISTS idx_series_estimated_release 
  ON public.series(estimated_next_release_at);

-- 4. Update chapters public read RLS policy:
-- Allow viewing metadata for published chapters even during the 30-minute early-access / scheduled window,
-- so visitors can see the "Unlocks in 30 min" countdown and "(Read now)" source scan link.
DROP POLICY IF EXISTS "chapters public read" ON public.chapters;
CREATE POLICY "chapters public read" ON public.chapters FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
  );

-- 5. Keep chapter_pages strictly protected during the 30-minute window:
-- Only chapters where scheduled_at IS NULL or scheduled_at <= now() have readable pages for the public.
DROP POLICY IF EXISTS "chapter_pages public read" ON public.chapter_pages;
CREATE POLICY "chapter_pages public read" ON public.chapter_pages FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = chapter_pages.chapter_id
        AND c.status = 'published'
        AND (c.scheduled_at IS NULL OR c.scheduled_at <= now())
    )
    OR public.has_role(auth.uid(), 'admin')
  );
