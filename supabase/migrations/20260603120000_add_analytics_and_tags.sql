-- Analytics and Tags System Migration

-- ============================================
-- TAGS & CATEGORIES SYSTEM
-- ============================================

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#8B5CF6', -- violet color
  icon text, -- emoji or icon name
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create series_tags junction table
CREATE TABLE IF NOT EXISTS series_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(series_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_series_tags_series_id ON series_tags(series_id);
CREATE INDEX IF NOT EXISTS idx_series_tags_tag_id ON series_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- ============================================
-- ANALYTICS SYSTEM
-- ============================================

-- Daily analytics aggregation table
CREATE TABLE IF NOT EXISTS daily_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  
  -- User metrics
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  vip_users integer DEFAULT 0,
  
  -- Content metrics
  total_series integer DEFAULT 0,
  new_series integer DEFAULT 0,
  total_chapters integer DEFAULT 0,
  new_chapters integer DEFAULT 0,
  
  -- Engagement metrics
  total_views integer DEFAULT 0,
  total_bookmarks integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_ratings integer DEFAULT 0,
  
  -- Reading metrics
  chapters_read integer DEFAULT 0,
  unique_readers integer DEFAULT 0,
  avg_reading_time_minutes numeric(10,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- Series performance analytics
CREATE TABLE IF NOT EXISTS series_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  -- Daily metrics
  views_today integer DEFAULT 0,
  bookmarks_today integer DEFAULT 0,
  comments_today integer DEFAULT 0,
  chapters_read_today integer DEFAULT 0,
  unique_readers_today integer DEFAULT 0,
  
  -- Cumulative metrics (updated daily)
  total_views integer DEFAULT 0,
  total_bookmarks integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  avg_rating numeric(3,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(series_id, date)
);

CREATE INDEX IF NOT EXISTS idx_series_analytics_series_date ON series_analytics(series_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_series_analytics_views ON series_analytics(views_today DESC);

-- Reading sessions for detailed analytics
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  
  -- Session data
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  pages_read integer DEFAULT 0,
  completed boolean DEFAULT false,
  
  -- Device info
  device_type text, -- mobile, tablet, desktop
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_series ON reading_sessions(series_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(started_at DESC);

-- Announcements system
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info', -- info, warning, success, error, event
  priority integer DEFAULT 0, -- higher = more important
  
  -- Display settings
  show_banner boolean DEFAULT true,
  banner_color text DEFAULT '#8B5CF6',
  icon text, -- emoji or icon name
  
  -- Targeting
  target_audience text DEFAULT 'all', -- all, vip, new_users, active_users
  
  -- Scheduling
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at) WHERE expires_at IS NOT NULL;

-- User announcement read status
CREATE TABLE IF NOT EXISTS user_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_announcements_user ON user_announcements(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1, updated_at = now() WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(0, usage_count - 1), updated_at = now() WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag usage count
DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON series_tags;
CREATE TRIGGER trigger_update_tag_usage_count
AFTER INSERT OR DELETE ON series_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to get trending tags (most used in last 30 days)
CREATE OR REPLACE FUNCTION get_trending_tags(limit_count integer DEFAULT 10)
RETURNS TABLE (
  tag_id uuid,
  tag_name text,
  tag_slug text,
  tag_color text,
  usage_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.color,
    COUNT(st.id) as usage_count
  FROM tags t
  LEFT JOIN series_tags st ON st.tag_id = t.id
  LEFT JOIN series s ON s.id = st.series_id
  WHERE s.created_at >= now() - interval '30 days'
  GROUP BY t.id, t.name, t.slug, t.color
  ORDER BY usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily analytics
CREATE OR REPLACE FUNCTION calculate_daily_analytics(target_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  v_total_users integer;
  v_new_users integer;
  v_active_users integer;
  v_vip_users integer;
  v_total_series integer;
  v_new_series integer;
  v_total_chapters integer;
  v_new_chapters integer;
  v_chapters_read integer;
  v_unique_readers integer;
BEGIN
  -- User metrics
  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE created_at <= target_date + interval '1 day';
  SELECT COUNT(*) INTO v_new_users FROM profiles WHERE DATE(created_at) = target_date;
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM reading_sessions WHERE DATE(started_at) = target_date;
  SELECT COUNT(*) INTO v_vip_users FROM profiles WHERE is_vip = true AND created_at <= target_date + interval '1 day';
  
  -- Content metrics
  SELECT COUNT(*) INTO v_total_series FROM series WHERE created_at <= target_date + interval '1 day';
  SELECT COUNT(*) INTO v_new_series FROM series WHERE DATE(created_at) = target_date;
  SELECT COUNT(*) INTO v_total_chapters FROM chapters WHERE created_at <= target_date + interval '1 day';
  SELECT COUNT(*) INTO v_new_chapters FROM chapters WHERE DATE(created_at) = target_date;
  
  -- Reading metrics
  SELECT COUNT(*) INTO v_chapters_read FROM reading_sessions WHERE DATE(started_at) = target_date;
  SELECT COUNT(DISTINCT user_id) INTO v_unique_readers FROM reading_sessions WHERE DATE(started_at) = target_date;
  
  -- Insert or update daily analytics
  INSERT INTO daily_analytics (
    date, total_users, new_users, active_users, vip_users,
    total_series, new_series, total_chapters, new_chapters,
    chapters_read, unique_readers
  ) VALUES (
    target_date, v_total_users, v_new_users, v_active_users, v_vip_users,
    v_total_series, v_new_series, v_total_chapters, v_new_chapters,
    v_chapters_read, v_unique_readers
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = v_total_users,
    new_users = v_new_users,
    active_users = v_active_users,
    vip_users = v_vip_users,
    total_series = v_total_series,
    new_series = v_new_series,
    total_chapters = v_total_chapters,
    new_chapters = v_new_chapters,
    chapters_read = v_chapters_read,
    unique_readers = v_unique_readers,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT TAGS
-- ============================================

INSERT INTO tags (name, slug, description, color, icon) VALUES
  ('Action', 'action', 'Fast-paced action and combat', '#EF4444', '⚔️'),
  ('Romance', 'romance', 'Love stories and relationships', '#EC4899', '❤️'),
  ('Comedy', 'comedy', 'Humorous and funny content', '#F59E0B', '😂'),
  ('Drama', 'drama', 'Emotional and dramatic storytelling', '#8B5CF6', '🎭'),
  ('Fantasy', 'fantasy', 'Magic and fantastical worlds', '#A855F7', '✨'),
  ('Sci-Fi', 'sci-fi', 'Science fiction and futuristic', '#3B82F6', '🚀'),
  ('Horror', 'horror', 'Scary and suspenseful', '#000000', '👻'),
  ('Mystery', 'mystery', 'Puzzles and investigations', '#6366F1', '🔍'),
  ('Slice of Life', 'slice-of-life', 'Everyday life stories', '#10B981', '🌸'),
  ('Adventure', 'adventure', 'Exciting journeys and quests', '#F97316', '🗺️'),
  ('Psychological', 'psychological', 'Mind games and complex themes', '#6B7280', '🧠'),
  ('Supernatural', 'supernatural', 'Ghosts, demons, and otherworldly', '#7C3AED', '👁️'),
  ('Martial Arts', 'martial-arts', 'Fighting techniques and training', '#DC2626', '🥋'),
  ('School Life', 'school-life', 'Stories set in schools', '#14B8A6', '🎒'),
  ('Historical', 'historical', 'Set in historical periods', '#92400E', '📜'),
  ('Isekai', 'isekai', 'Transported to another world', '#A855F7', '🌍'),
  ('Reincarnation', 'reincarnation', 'Reborn or second life stories', '#C026D3', '♻️'),
  ('Cultivation', 'cultivation', 'Power leveling and training', '#059669', '🌟'),
  ('Revenge', 'revenge', 'Vengeance and payback', '#991B1B', '⚡'),
  ('Regression', 'regression', 'Time travel to the past', '#2563EB', '⏰')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Tags are readable by everyone
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Only admins can manage tags" ON tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Series tags are readable by everyone
ALTER TABLE series_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Series tags are viewable by everyone" ON series_tags FOR SELECT USING (true);
CREATE POLICY "Only admins can manage series tags" ON series_tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Analytics are admin-only
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view analytics" ON daily_analytics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

ALTER TABLE series_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view series analytics" ON series_analytics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON reading_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own sessions" ON reading_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all sessions" ON reading_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active announcements are viewable by everyone" ON announcements 
  FOR SELECT USING (
    is_active = true 
    AND starts_at <= now() 
    AND (expires_at IS NULL OR expires_at > now())
  );
CREATE POLICY "Only admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

ALTER TABLE user_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own announcement reads" ON user_announcements 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark announcements as read" ON user_announcements 
  FOR INSERT WITH CHECK (user_id = auth.uid());
