CREATE OR REPLACE FUNCTION public.increment_series_view(_series_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.series
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = _series_id
    AND (is_hidden = false OR public.has_role(auth.uid(), 'admin'));
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_chapter_view(_chapter_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_series_id UUID;
BEGIN
  UPDATE public.chapters
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = _chapter_id
    AND (
      status = 'published'
      AND (scheduled_at IS NULL OR scheduled_at <= now())
    )
  RETURNING series_id INTO target_series_id;

  IF target_series_id IS NOT NULL THEN
    UPDATE public.series
    SET view_count = view_count + 1,
        updated_at = now()
    WHERE id = target_series_id
      AND (is_hidden = false OR public.has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_series_view(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_chapter_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_series_view(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_chapter_view(UUID) TO anon, authenticated;
