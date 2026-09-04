-- =========================================================================
-- Migration: Half-star Ratings (Numeric Precision) & Library Permissions
-- Date: 2026-09-04
-- =========================================================================

-- 1. Drop old policies first because they depend on the column definition
DROP POLICY IF EXISTS "ratings self write" ON public.ratings;
DROP POLICY IF EXISTS "ratings self update" ON public.ratings;

-- 2. Upgrade public.ratings.rating from INT to NUMERIC(3, 1) for half-star precision (e.g. 0.5, 1.5, 2.5, 3.5, 4.5, 5.0)
ALTER TABLE public.ratings ALTER COLUMN rating TYPE NUMERIC(3, 1);

-- 3. Re-create policies with check allowing half-star increments between 0.5 and 10.0
CREATE POLICY "ratings self write" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND rating >= 0.5 AND rating <= 10.0);

CREATE POLICY "ratings self update" ON public.ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (rating >= 0.5 AND rating <= 10.0);

-- 4. Update the trigger to calculate series.rating_average with numeric precision
-- Normalizes any ratings > 5 down to 5.0 scale so series.rating_average is always 0.0 - 5.0
CREATE OR REPLACE FUNCTION public.refresh_series_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid UUID := COALESCE(NEW.series_id, OLD.series_id);
BEGIN
  UPDATE public.series s SET rating_average = COALESCE((
    SELECT ROUND(AVG(
      CASE WHEN rating > 5.0 THEN rating / 2.0 ELSE rating END
    )::numeric, 2)
    FROM public.ratings WHERE series_id = sid
  ), 0) WHERE s.id = sid;
  RETURN NULL;
END;
$$;

-- 5. Enable public read access on user_library so follower counts and status checks work reliably for all visitors
GRANT SELECT ON public.user_library TO anon;

DROP POLICY IF EXISTS "user_library public read" ON public.user_library;
CREATE POLICY "user_library public read" ON public.user_library
  FOR SELECT TO anon, authenticated
  USING (true);
