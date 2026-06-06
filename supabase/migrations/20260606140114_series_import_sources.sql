CREATE TABLE IF NOT EXISTS public.series_import_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  source_site text,
  scanlation_group text,
  image_url_example text,
  enabled boolean NOT NULL DEFAULT true,
  auto_publish boolean NOT NULL DEFAULT true,
  check_interval_minutes integer NOT NULL DEFAULT 60 CHECK (check_interval_minutes >= 10),
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.series_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.series_import_sources(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  message text NOT NULL,
  chapters_found integer NOT NULL DEFAULT 0,
  chapters_imported integer NOT NULL DEFAULT 0,
  chapters_skipped integer NOT NULL DEFAULT 0,
  chapters_failed integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_series_import_sources_series
  ON public.series_import_sources(series_id);
CREATE INDEX IF NOT EXISTS idx_series_import_sources_enabled_next_check
  ON public.series_import_sources(enabled, last_checked_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_series_import_sources_unique_source_group
  ON public.series_import_sources(series_id, source_url, COALESCE(scanlation_group, ''));
CREATE INDEX IF NOT EXISTS idx_series_import_logs_source_created
  ON public.series_import_logs(source_id, created_at DESC);

ALTER TABLE public.series_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_import_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_import_sources TO authenticated;
GRANT SELECT, INSERT ON public.series_import_logs TO authenticated;
GRANT ALL ON public.series_import_sources TO service_role;
GRANT ALL ON public.series_import_logs TO service_role;

DROP POLICY IF EXISTS "Admins manage series import sources" ON public.series_import_sources;
CREATE POLICY "Admins manage series import sources"
  ON public.series_import_sources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view series import logs" ON public.series_import_logs;
CREATE POLICY "Admins view series import logs"
  ON public.series_import_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert series import logs" ON public.series_import_logs;
CREATE POLICY "Admins insert series import logs"
  ON public.series_import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_series_import_source_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_series_import_source_updated_at ON public.series_import_sources;
CREATE TRIGGER set_series_import_source_updated_at
  BEFORE UPDATE ON public.series_import_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_series_import_source_updated_at();
