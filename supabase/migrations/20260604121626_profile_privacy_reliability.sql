-- Make profile privacy updates explicit and verified-friendly.
-- UPDATE policies need a SELECT-visible row first, then a check that the
-- updated row still belongs to the authenticated user.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (
  profile_visibility,
  show_reading_history,
  show_achievements,
  show_statistics
) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

UPDATE public.profiles
SET
  profile_visibility = COALESCE(profile_visibility, 'public'),
  show_reading_history = COALESCE(show_reading_history, true),
  show_achievements = COALESCE(show_achievements, true),
  show_statistics = COALESCE(show_statistics, true)
WHERE
  profile_visibility IS NULL
  OR show_reading_history IS NULL
  OR show_achievements IS NULL
  OR show_statistics IS NULL;
