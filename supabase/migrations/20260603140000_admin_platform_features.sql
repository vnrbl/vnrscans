-- Admin platform features: banners, moderation queue, activity logs,

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
-- role permissions, gamification catalog, announcement admin access

-- ============================================
-- BANNERS & CAROUSEL
-- ============================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  link_text text DEFAULT 'Learn More',
  position text NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'featured', 'sidebar')),
  priority integer NOT NULL DEFAULT 0,
  background_color text DEFAULT '#8B5CF6',
  text_color text DEFAULT '#FFFFFF',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  target_series_id uuid REFERENCES public.series(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners (position, priority DESC)
  WHERE is_active = true;

-- ============================================
-- MODERATION QUEUE
-- ============================================
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  auto_flagged boolean NOT NULL DEFAULT false,
  flag_score numeric(4,3) DEFAULT 0,
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  action_taken text DEFAULT 'none',
  source_report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue (status, priority DESC, created_at DESC);

-- Enqueue new reports
CREATE OR REPLACE FUNCTION public.enqueue_report_for_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.moderation_queue (
    content_type,
    content_id,
    reason,
    priority,
    reported_by,
    source_report_id
  ) VALUES (
    NEW.target_type,
    NEW.target_id,
    NEW.reason,
    'normal',
    NEW.user_id,
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enqueue_report_moderation ON public.reports;
CREATE TRIGGER trigger_enqueue_report_moderation
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_report_for_moderation();

-- ============================================
-- ADMIN ACTIVITY / SECURITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON public.admin_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor ON public.admin_activity_logs (actor_id, created_at DESC);

-- ============================================
-- ROLE PERMISSIONS (fine-grained matrix)
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  resource_type text NOT NULL DEFAULT 'all',
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  can_moderate boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_roles boolean NOT NULL DEFAULT false,
  can_view_analytics boolean NOT NULL DEFAULT false,
  can_manage_settings boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_name, resource_type)
);

-- Default permission templates
INSERT INTO public.role_permissions (role_name, resource_type, can_read, can_write, can_delete, can_publish, can_moderate, can_manage_users, can_manage_roles, can_view_analytics, can_manage_settings)
VALUES
  ('admin', 'all', true, true, true, true, true, true, true, true, true),
  ('moderator', 'all', true, true, false, false, true, false, false, true, false),
  ('moderator', 'comment', true, true, true, false, true, false, false, false, false),
  ('user', 'all', true, false, false, false, false, false, false, false, false)
ON CONFLICT (role_name, resource_type) DO NOTHING;

-- ============================================
-- GAMIFICATION CATALOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL DEFAULT 'chapters_read',
  requirement_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 10,
  badge_color text DEFAULT '#8B5CF6',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_secret boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.achievements 
  ADD COLUMN IF NOT EXISTS is_secret boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  xp_multiplier numeric(4,2) NOT NULL DEFAULT 2.0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  applies_to text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_achievements
  ADD COLUMN IF NOT EXISTS achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements (achievement_id);

-- Seed starter achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity)
SELECT * FROM (VALUES
  ('First Chapter', 'Read your first chapter', '📖', 'reading', 'chapters_read', 1, 25, 'common'),
  ('Bookworm', 'Read 10 chapters', '🐛', 'reading', 'chapters_read', 10, 50, 'uncommon'),
  ('Marathon Reader', 'Read 100 chapters', '🏃', 'reading', 'chapters_read', 100, 200, 'rare'),
  ('Week Warrior', 'Maintain a 7-day reading streak', '🔥', 'streak', 'reading_streak', 7, 100, 'epic')
) AS v(name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements LIMIT 1);

-- ============================================
-- BANNER CLICK / VIEW RPCs
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_banner_view(banner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.banners SET view_count = view_count + 1, updated_at = now() WHERE id = banner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_banner_click(banner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.banners SET click_count = click_count + 1, updated_at = now() WHERE id = banner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_banner_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_banner_click(uuid) TO anon, authenticated;

-- Announcements: admins can list all (including inactive)
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
CREATE POLICY "Admins can view all announcements" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active banners are public" ON public.banners
  FOR SELECT USING (
    is_active = true
    AND starts_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );
CREATE POLICY "Admins manage banners" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );
CREATE POLICY "Mods update moderation queue" ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view activity logs" ON public.admin_activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff insert activity logs" ON public.admin_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view role permissions" ON public.role_permissions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public" ON public.achievements FOR SELECT USING (is_active = true AND is_secret = false);
CREATE POLICY "Admins manage achievements" ON public.achievements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active xp events are public" ON public.xp_events
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins manage xp events" ON public.xp_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admins can assign roles
DROP POLICY IF EXISTS "admins manage user roles" ON public.user_roles;
CREATE POLICY "admins manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT SELECT, UPDATE ON public.moderation_queue TO authenticated;
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xp_events TO authenticated;
