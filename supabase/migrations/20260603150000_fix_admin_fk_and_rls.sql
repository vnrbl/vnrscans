-- Fix FK mismatches (auth user id vs profiles.id) and admin RLS for banners/gamification

-- ============================================
-- FK: point actor columns at auth.users (matches app + reports.user_id)
-- ============================================
ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.admin_activity_logs
  DROP CONSTRAINT IF EXISTS admin_activity_logs_actor_id_fkey;

ALTER TABLE public.admin_activity_logs
  ADD CONSTRAINT admin_activity_logs_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.moderation_queue
  DROP CONSTRAINT IF EXISTS moderation_queue_reported_by_fkey;

ALTER TABLE public.moderation_queue
  DROP CONSTRAINT IF EXISTS moderation_queue_reviewed_by_fkey;

ALTER TABLE public.moderation_queue
  ADD CONSTRAINT moderation_queue_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.moderation_queue
  ADD CONSTRAINT moderation_queue_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================
-- BANNERS: staff can list inactive + explicit INSERT/UPDATE policies
-- ============================================
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;

CREATE POLICY "Staff select all banners" ON public.banners
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff insert banners" ON public.banners
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff update banners" ON public.banners
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff delete banners" ON public.banners
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- GAMIFICATION: allow moderators + staff can read catalog in admin
-- ============================================
DROP POLICY IF EXISTS "Admins manage achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins manage xp events" ON public.xp_events;

CREATE POLICY "Staff select all achievements" ON public.achievements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff insert achievements" ON public.achievements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff update achievements" ON public.achievements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff delete achievements" ON public.achievements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff select all xp events" ON public.xp_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff insert xp events" ON public.xp_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff update xp events" ON public.xp_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff delete xp events" ON public.xp_events
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Announcements: ensure staff can insert/update (split from broad ALL if needed)
DROP POLICY IF EXISTS "Staff manage announcements" ON public.announcements;

CREATE POLICY "Staff insert announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff update announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Staff delete announcements" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
