-- Profile Enhancements: Privacy, Collections, Goals, Badges, Notifications

-- ============================================
-- 1. PRIVACY SETTINGS
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_reading_history BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_achievements BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT true;

-- ============================================
-- 2. READING GOALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  target_type TEXT NOT NULL CHECK (target_type IN ('chapters', 'series', 'streak')),
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, goal_type, target_type, is_active)
);

CREATE INDEX IF NOT EXISTS idx_reading_goals_user ON public.reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_active ON public.reading_goals(user_id, is_active);

-- ============================================
-- 3. PROFILE BADGES/TITLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '🏅',
  badge_color TEXT DEFAULT '#8B5CF6',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.profile_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_equipped ON public.user_badges(user_id, is_equipped);

-- ============================================
-- 4. READING COLLECTIONS/LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reading_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_url TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.reading_collections(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(collection_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.reading_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);

-- ============================================
-- 5. USER NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('chapter', 'achievement', 'follow', 'comment', 'system', 'goal')),
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT,
  icon TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.user_notifications(user_id, is_read, created_at DESC);

-- Notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "new_chapters": true,
    "achievements": true,
    "follows": true,
    "comments": true,
    "goals": true,
    "email_enabled": false
  }'::jsonb;

-- ============================================
-- 6. PROFILE WIDGETS (for sharing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profile_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('card', 'banner', 'minimal')),
  theme TEXT DEFAULT 'dark',
  embed_code TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_widgets_user ON public.profile_widgets(user_id);

-- ============================================
-- 7. MILESTONE CELEBRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎉',
  achieved_at TIMESTAMPTZ DEFAULT now(),
  is_celebrated BOOLEAN DEFAULT false,
  UNIQUE(user_id, milestone_type, milestone_value)
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.user_milestones(user_id, achieved_at DESC);

-- ============================================
-- 8. FAVORITE GENRES TRACKING
-- ============================================
CREATE OR REPLACE VIEW public.user_favorite_genres AS
SELECT 
  rh.user_id,
  g.id as genre_id,
  g.name as genre_name,
  g.slug as genre_slug,
  COUNT(DISTINCT rh.series_id) as series_count,
  COUNT(rh.id) as chapter_count,
  ROUND((COUNT(DISTINCT rh.series_id)::numeric / NULLIF(
    (SELECT COUNT(DISTINCT series_id) FROM reading_history WHERE user_id = rh.user_id), 0
  ) * 100), 2) as percentage
FROM reading_history rh
JOIN series s ON rh.series_id = s.id
JOIN series_genres sg ON s.id = sg.series_id
JOIN genres g ON sg.genre_id = g.id
GROUP BY rh.user_id, g.id, g.name, g.slug
ORDER BY series_count DESC;

-- ============================================
-- SEED DATA
-- ============================================

-- Default profile badges
INSERT INTO public.profile_badges (name, description, icon, requirement_type, requirement_value, badge_color)
SELECT * FROM (VALUES
  ('Supreme Dao Ancestor', 'Read 1000+ chapters', '🧘‍♂️', 'chapters_read', 1000, '#EF4444'),
  ('Qi Condensation Speedrunner', 'Read 50 chapters in one day', '⚡', 'daily_chapters', 50, '#3B82F6'),
  ('Grandmaster of Demonic Cultivation', 'Completed 20+ series', '💀', 'series_completed', 20, '#8B5CF6'),
  ('Sword Sect Disciple', 'Followed 50+ series', '⚔️', 'series_followed', 50, '#10B981'),
  ('Asura Demon Emperor', 'Maintained 100-day streak', '👹', 'reading_streak', 100, '#F59E0B'),
  ('Rising Sun Qi Gatherer', 'Read before 6 AM', '🌅', 'early_reader', 1, '#FBBF24'),
  ('Shadow Realm Wanderer', 'Read after midnight', '🌙', 'night_reader', 1, '#6366F1'),
  ('Myriad Beast Emperor', 'Read 10+ different genres', '🦁', 'genres_explored', 10, '#14B8A6'),
  ('Heavenly Dao Gossip Scholar', 'Posted 100+ comments', '📜', 'comments_posted', 100, '#06B6D4'),
  ('Supreme Immortal Judge', 'Rated 50+ series', '⚖️', 'ratings_given', 50, '#EC4899')
) AS v(name, description, icon, requirement_type, requirement_value, badge_color)
WHERE NOT EXISTS (SELECT 1 FROM public.profile_badges LIMIT 1);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Reading Goals
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own goals" ON public.reading_goals;
CREATE POLICY "Users view own goals" ON public.reading_goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own goals" ON public.reading_goals;
CREATE POLICY "Users manage own goals" ON public.reading_goals FOR ALL USING (auth.uid() = user_id);

-- Profile Badges (public read)
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges are public" ON public.profile_badges;
CREATE POLICY "Badges are public" ON public.profile_badges FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage badges" ON public.profile_badges;
CREATE POLICY "Admins manage badges" ON public.profile_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User Badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own badges" ON public.user_badges;
CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own badges" ON public.user_badges;
CREATE POLICY "Users manage own badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- Collections
ALTER TABLE public.reading_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own collections" ON public.reading_collections;
CREATE POLICY "Users view own collections" ON public.reading_collections FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public collections viewable" ON public.reading_collections;
CREATE POLICY "Public collections viewable" ON public.reading_collections FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users manage own collections" ON public.reading_collections;
CREATE POLICY "Users manage own collections" ON public.reading_collections FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Collection items inherit visibility" ON public.collection_items;
CREATE POLICY "Collection items inherit visibility" ON public.collection_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reading_collections 
    WHERE id = collection_items.collection_id 
    AND (user_id = auth.uid() OR is_public = true)
  )
);
DROP POLICY IF EXISTS "Users manage own collection items" ON public.collection_items;
CREATE POLICY "Users manage own collection items" ON public.collection_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.reading_collections 
    WHERE id = collection_items.collection_id AND user_id = auth.uid()
  )
);

-- Notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.user_notifications;
CREATE POLICY "Users view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.user_notifications;
CREATE POLICY "Users update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System creates notifications" ON public.user_notifications;
CREATE POLICY "System creates notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- Profile Widgets
ALTER TABLE public.profile_widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Widgets publicly viewable" ON public.profile_widgets;
CREATE POLICY "Widgets publicly viewable" ON public.profile_widgets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own widgets" ON public.profile_widgets;
CREATE POLICY "Users manage own widgets" ON public.profile_widgets FOR ALL USING (auth.uid() = user_id);

-- Milestones
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own milestones" ON public.user_milestones;
CREATE POLICY "Users view own milestones" ON public.user_milestones FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System creates milestones" ON public.user_milestones;
CREATE POLICY "System creates milestones" ON public.user_milestones FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_reading_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily goals
  UPDATE public.reading_goals
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id
    AND is_active = true
    AND goal_type = 'daily'
    AND target_type = 'chapters'
    AND start_date = CURRENT_DATE;

  -- Check if goal is completed
  UPDATE public.reading_goals
  SET completed_at = now(),
      is_active = false
  WHERE user_id = NEW.user_id
    AND current_value >= target_value
    AND completed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal_progress ON reading_history;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT ON reading_history
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_goal_progress();

-- Function to create milestone notifications
CREATE OR REPLACE FUNCTION check_user_milestones()
RETURNS TRIGGER AS $$
DECLARE
  chapters_count INTEGER;
  streak INTEGER;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO chapters_count FROM reading_history WHERE user_id = NEW.user_id;
  SELECT reading_streak INTO streak FROM profiles WHERE user_id = NEW.user_id;

  -- Check for chapter milestones
  IF chapters_count IN (10, 50, 100, 500, 1000) THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_value, title, description)
    VALUES (
      NEW.user_id,
      'chapters_read',
      chapters_count,
      chapters_count || ' Chapters Read!',
      'Congratulations on reading ' || chapters_count || ' chapters!'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Check for streak milestones
  IF streak IN (7, 30, 100, 365) THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_value, title, description)
    VALUES (
      NEW.user_id,
      'reading_streak',
      streak,
      streak || '-Day Streak!',
      'Amazing! You''ve maintained a ' || streak || '-day reading streak!'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_milestones ON reading_history;
CREATE TRIGGER trigger_check_milestones
  AFTER INSERT ON reading_history
  FOR EACH ROW
  EXECUTE FUNCTION check_user_milestones();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_goals TO authenticated;
GRANT SELECT ON public.profile_badges TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profile_widgets TO authenticated;
GRANT SELECT, INSERT ON public.user_milestones TO authenticated;

