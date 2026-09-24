-- ============================================================================
-- Performance Optimization Indexes
-- Target queries:
-- 1. Chapter lookup by slug in reader: chapters(slug)
-- 2. Sibling / published chapters by series: chapters(series_id, chapter_number DESC)
-- 3. Reading history ordered by updated_at: reading_history(user_id, updated_at DESC)
-- 4. Series catalog sorting by updated_at: series(updated_at DESC)
-- 5. Fuzzy text search on series titles: pg_trgm GIN index
--
-- NOTE: On hosted Supabase the CLI role cannot CREATE EXTENSION, so the trgm
-- indexes are wrapped in an exception guard: they are created only when the
-- pg_trgm extension is already available (enabled via Dashboard → Database →
-- Extensions, or by a superuser). All other indexes apply unconditionally.
-- ============================================================================

-- 1. Index on chapter slug (fixes sequential full-table scan on /title/[slug]/[chapterSlug])
CREATE INDEX IF NOT EXISTS idx_chapters_slug 
  ON public.chapters(slug);

-- 2. Index on published chapters per series ordered by chapter_number
CREATE INDEX IF NOT EXISTS idx_chapters_series_published_num 
  ON public.chapters(series_id, chapter_number DESC) 
  WHERE status = 'published';

-- 3. Index on user reading history for fast history retrieval
CREATE INDEX IF NOT EXISTS idx_reading_history_user_updated 
  ON public.reading_history(user_id, updated_at DESC);

-- 4. Index on non-hidden series by updated_at for homepage and browse catalog
CREATE INDEX IF NOT EXISTS idx_series_visible_updated 
  ON public.series(updated_at DESC) 
  WHERE is_hidden = false;

-- 5. Trigram indexes for fast title search — only if pg_trgm is available.
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_series_title_trgm 
    ON public.series USING gin(title gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_series_alt_titles_trgm 
    ON public.series USING gin(alternative_titles gin_trgm_ops);
  RAISE NOTICE 'pg_trgm indexes created';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'pg_trgm extension not available — skipping trigram indexes. Enable pg_trgm in Dashboard → Database → Extensions, then re-run.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping trigram indexes: %', SQLERRM;
END $$;
