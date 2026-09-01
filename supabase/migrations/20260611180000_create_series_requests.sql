CREATE TABLE IF NOT EXISTS public.series_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type public.series_type NULL,
  source_url TEXT NULL,
  contact_email TEXT NULL,
  notes TEXT NULL,
  requested_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  staff_notes TEXT NULL,
  reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS series_requests_status_created_idx
  ON public.series_requests (status, created_at DESC);

ALTER TABLE public.series_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit series requests"
  ON public.series_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own series requests"
  ON public.series_requests
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Staff can read all series requests"
  ON public.series_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator', 'uploader')
    )
  );

CREATE POLICY "Staff can update series requests"
  ON public.series_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator', 'uploader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator', 'uploader')
    )
  );

GRANT INSERT ON public.series_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.series_requests TO authenticated;
