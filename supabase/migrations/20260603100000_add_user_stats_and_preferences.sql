-- Add user preferences and stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_read_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_level INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_points INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reader_settings JSONB DEFAULT '{
  "readingDirection": "ltr",
  "pageFit": "width",
  "readingMode": "page",
  "imageQuality": "high",
  "autoScrollSpeed": 50
}'::jsonb;

-- Create user recommendations table
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  score FLOAT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, series_id)
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_recommendations
CREATE POLICY "Users can view their own recommendations" 
  ON user_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations" 
  ON user_recommendations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update recommendations" 
  ON user_recommendations FOR UPDATE 
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
  ON user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" 
  ON user_achievements FOR INSERT 
  WITH CHECK (true);

-- Function to calculate reading streak
CREATE OR REPLACE FUNCTION update_reading_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    last_read_date = CURRENT_DATE,
    reading_streak = CASE
      WHEN last_read_date = CURRENT_DATE THEN reading_streak
      WHEN last_read_date = CURRENT_DATE - INTERVAL '1 day' THEN reading_streak + 1
      ELSE 1
    END,
    experience_points = experience_points + 10,
    user_level = FLOOR(SQRT(experience_points + 10) / 2) + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak when reading history is updated
DROP TRIGGER IF EXISTS update_streak_on_read ON reading_history;
CREATE TRIGGER update_streak_on_read
  AFTER INSERT OR UPDATE ON reading_history
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_streak();

-- Function to generate recommendations based on reading history
CREATE OR REPLACE FUNCTION generate_user_recommendations(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_genres TEXT[];
  genre_record RECORD;
BEGIN
  -- Get user's favorite genres
  SELECT ARRAY_AGG(DISTINCT g.slug) INTO user_genres
  FROM reading_history rh
  JOIN series s ON rh.series_id = s.id
  JOIN series_genres sg ON s.id = sg.series_id
  JOIN genres g ON sg.genre_id = g.id
  WHERE rh.user_id = target_user_id
  LIMIT 5;

  -- Clear old recommendations
  DELETE FROM user_recommendations WHERE user_id = target_user_id;

  -- Insert new recommendations based on genres
  INSERT INTO user_recommendations (user_id, series_id, score, reason)
  SELECT 
    target_user_id,
    s.id,
    s.rating_average * 0.5 + s.view_count::float / 1000 * 0.3 + COUNT(sg.genre_id)::float * 0.2 as score,
    'Based on your reading history'
  FROM series s
  JOIN series_genres sg ON s.id = sg.series_id
  JOIN genres g ON sg.genre_id = g.id
  WHERE g.slug = ANY(user_genres)
    AND s.id NOT IN (SELECT series_id FROM reading_history WHERE user_id = target_user_id)
  GROUP BY s.id, s.rating_average, s.view_count
  ORDER BY score DESC
  LIMIT 20
  ON CONFLICT (user_id, series_id) DO UPDATE
    SET score = EXCLUDED.score, reason = EXCLUDED.reason;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(user_level DESC);
