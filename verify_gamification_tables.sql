-- Verify and fix gamification tables

-- Check if achievements table exists and has correct structure
DO $$
BEGIN
    -- Ensure achievements table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
        RAISE NOTICE 'Creating achievements table...';
        CREATE TABLE public.achievements (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text,
          icon text DEFAULT '🏆',
          category text NOT NULL DEFAULT 'general',
          requirement_type text NOT NULL DEFAULT 'chapters_read',
          requirement_value integer NOT NULL DEFAULT 1,
          xp_reward integer NOT NULL DEFAULT 10,
          badge_color text DEFAULT '#8B5CF6',
          rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
          is_secret boolean NOT NULL DEFAULT false,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;

    -- Ensure xp_events table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'xp_events') THEN
        RAISE NOTICE 'Creating xp_events table...';
        CREATE TABLE public.xp_events (
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
    END IF;
END $$;

-- Enable RLS on achievements if not already enabled
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Achievements are public" ON public.achievements;
DROP POLICY IF EXISTS "Admins manage achievements" ON public.achievements;

-- Recreate policies
CREATE POLICY "Achievements are public" 
  ON public.achievements 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins manage achievements" 
  ON public.achievements
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Enable RLS on xp_events if not already enabled
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Active xp events are public" ON public.xp_events;
DROP POLICY IF EXISTS "Admins manage xp events" ON public.xp_events;

-- Recreate policies
CREATE POLICY "Active xp events are public" 
  ON public.xp_events
  FOR SELECT 
  USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins manage xp events" 
  ON public.xp_events
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xp_events TO authenticated;

-- Seed starter achievements if table is empty
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity, is_active)
SELECT * FROM (VALUES
  ('First Chapter', 'Read your first chapter', '📖', 'reading', 'chapters_read', 1, 25, 'common', true),
  ('Bookworm', 'Read 10 chapters', '🐛', 'reading', 'chapters_read', 10, 50, 'rare', true),
  ('Marathon Reader', 'Read 100 chapters', '🏃', 'reading', 'chapters_read', 100, 200, 'epic', true),
  ('Week Warrior', 'Maintain a 7-day reading streak', '🔥', 'reading', 'streak_days', 7, 100, 'legendary', true)
) AS v(name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements LIMIT 1);

SELECT 'Gamification tables verified and fixed!' AS result;
