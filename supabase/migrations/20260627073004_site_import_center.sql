CREATE TABLE public.site_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_site text NOT NULL,
  status text NOT NULL DEFAULT 'scanning'
    CHECK (status IN ('scanning', 'ready', 'importing', 'completed', 'partial', 'failed')),
  total_items integer NOT NULL DEFAULT 0 CHECK (total_items >= 0),
  selected_items integer NOT NULL DEFAULT 0 CHECK (selected_items >= 0),
  imported_items integer NOT NULL DEFAULT 0 CHECK (imported_items >= 0),
  failed_items integer NOT NULL DEFAULT 0 CHECK (failed_items >= 0),
  error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.site_import_jobs(id) ON DELETE CASCADE,
  source_series_id text,
  source_url text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  cover_url text,
  chapter_count integer NOT NULL DEFAULT 0 CHECK (chapter_count >= 0),
  last_chapter_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  existing_series_id uuid REFERENCES public.series(id) ON DELETE SET NULL,
  selected boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'duplicate', 'queued', 'importing', 'completed', 'failed')),
  import_mode text NOT NULL DEFAULT 'latest'
    CHECK (import_mode IN ('metadata', 'latest', 'all')),
  chapter_limit integer NOT NULL DEFAULT 5 CHECK (chapter_limit BETWEEN 1 AND 100),
  auto_publish boolean NOT NULL DEFAULT true,
  imported_chapters integer NOT NULL DEFAULT 0 CHECK (imported_chapters >= 0),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, source_url)
);

CREATE INDEX idx_site_import_jobs_created
  ON public.site_import_jobs(created_at DESC);
CREATE INDEX idx_site_import_items_job_status
  ON public.site_import_items(job_id, selected, status);
CREATE INDEX idx_site_import_items_existing_series
  ON public.site_import_items(existing_series_id)
  WHERE existing_series_id IS NOT NULL;

ALTER TABLE public.site_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_import_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.site_import_jobs FROM anon, authenticated;
REVOKE ALL ON public.site_import_items FROM anon, authenticated;
GRANT ALL ON public.site_import_jobs TO service_role;
GRANT ALL ON public.site_import_items TO service_role;

CREATE OR REPLACE FUNCTION public.set_site_import_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_site_import_jobs_updated_at
  BEFORE UPDATE ON public.site_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_site_import_updated_at();

CREATE TRIGGER set_site_import_items_updated_at
  BEFORE UPDATE ON public.site_import_items
  FOR EACH ROW EXECUTE FUNCTION public.set_site_import_updated_at();
