-- Fix recommendations: add missing DELETE policy + improve RPC function

-- 1. Add missing DELETE policy so the RPC function can clear old recommendations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_recommendations' 
    AND policyname = 'Users can delete their own recommendations'
  ) THEN
    CREATE POLICY "Users can delete their own recommendations"
      ON user_recommendations FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Recreate generate_user_recommendations with SECURITY DEFINER
-- so it can reliably delete + insert regardless of caller's RLS context.
-- Also fix the LIMIT 5 bug (was limiting reading_history rows before aggregation).
CREATE OR REPLACE FUNCTION public.generate_user_recommendations(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_genres TEXT[];
BEGIN
  IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: users may only refresh their own recommendations'
      USING ERRCODE = '42501';
  END IF;

  -- Get user's favorite genres (aggregate first, then limit genre count)
  SELECT ARRAY(
    SELECT DISTINCT g.slug
    FROM public.reading_history rh
    JOIN public.series s ON rh.series_id = s.id
    JOIN public.series_genres sg ON s.id = sg.series_id
    JOIN public.genres g ON sg.genre_id = g.id
    WHERE rh.user_id = target_user_id
    ORDER BY g.slug
    LIMIT 10
  ) INTO user_genres;

  -- If no genres found from reading history, try bookmarks
  IF user_genres IS NULL OR array_length(user_genres, 1) IS NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT g.slug
      FROM public.bookmarks bk
      JOIN public.series s ON bk.series_id = s.id
      JOIN public.series_genres sg ON s.id = sg.series_id
      JOIN public.genres g ON sg.genre_id = g.id
      WHERE bk.user_id = target_user_id
      ORDER BY g.slug
      LIMIT 10
    ) INTO user_genres;
  END IF;

  -- Still no genres? Nothing to recommend.
  IF user_genres IS NULL OR array_length(user_genres, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Clear old recommendations
  DELETE FROM public.user_recommendations WHERE user_id = target_user_id;

  -- Insert new recommendations based on genres
  -- Exclude series the user has already read or bookmarked
  INSERT INTO public.user_recommendations (user_id, series_id, score, reason)
  SELECT 
    target_user_id,
    s.id,
    COALESCE(s.rating_average, 0) * 0.4 
      + LEAST(COALESCE(s.view_count, 0)::float / 10000, 1.0) * 0.2 
      + COUNT(DISTINCT sg.genre_id)::float / array_length(user_genres, 1) * 0.4 AS score,
    'Based on your reading history'
  FROM public.series s
  JOIN public.series_genres sg ON s.id = sg.series_id
  JOIN public.genres g ON sg.genre_id = g.id
  WHERE g.slug = ANY(user_genres)
    AND s.is_hidden = false
    AND s.id NOT IN (
      SELECT series_id FROM public.reading_history WHERE user_id = target_user_id
      UNION
      SELECT series_id FROM public.bookmarks WHERE user_id = target_user_id
    )
  GROUP BY s.id, s.rating_average, s.view_count
  ORDER BY score DESC
  LIMIT 30
  ON CONFLICT (user_id, series_id) DO UPDATE
    SET score = EXCLUDED.score, 
        reason = EXCLUDED.reason,
        created_at = now();
END;
$$;

-- Restrict execute to authenticated users only (defense in depth for SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.generate_user_recommendations(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_user_recommendations(UUID) TO authenticated;
