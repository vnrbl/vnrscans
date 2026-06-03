-- ============================================
-- COMPLETE NOTIFICATION SYSTEM FIX
-- ============================================
-- Run this entire script in Supabase SQL Editor while logged in as a user
-- This will:
-- 1. Verify all tables exist
-- 2. Create missing tables/triggers
-- 3. Test the notification system
-- 4. Show you your notifications

-- ============================================
-- STEP 1: CREATE series_follows TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.series_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_series_follows_user ON public.series_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_series_follows_series ON public.series_follows(series_id);

-- Enable RLS
ALTER TABLE public.series_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view all follows" ON public.series_follows;
CREATE POLICY "Users can view all follows" 
  ON public.series_follows FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users manage own follows" ON public.series_follows;
CREATE POLICY "Users manage own follows" 
  ON public.series_follows FOR ALL 
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.series_follows TO authenticated;

-- ============================================
-- STEP 2: CREATE NOTIFICATION TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION notify_followers_of_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
  series_title TEXT;
  series_slug TEXT;
BEGIN
  -- Only notify if chapter status is 'published'
  IF NEW.status = 'published' AND (NEW.scheduled_at IS NULL OR NEW.scheduled_at <= NOW()) THEN
    
    -- Get series info
    SELECT title, slug INTO series_title, series_slug
    FROM public.series
    WHERE id = NEW.series_id;
    
    -- Insert notifications for all followers
    INSERT INTO public.user_notifications (
      user_id,
      notification_type,
      title,
      message,
      link_url,
      icon
    )
    SELECT 
      sf.user_id,
      'chapter',
      series_title || ' - New Chapter',
      'Chapter ' || NEW.chapter_number || 
      CASE 
        WHEN NEW.title IS NOT NULL AND NEW.title != '' 
        THEN ': ' || NEW.title 
        ELSE '' 
      END || ' is now available!',
      '/title/' || series_slug || '/' || NEW.slug,
      '📖'
    FROM public.series_follows sf
    WHERE sf.series_id = NEW.series_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON public.chapters;

CREATE TRIGGER trigger_notify_new_chapter
  AFTER INSERT OR UPDATE OF status ON public.chapters
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION notify_followers_of_new_chapter();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapters_series_status ON public.chapters(series_id, status, created_at DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_followers_of_new_chapter() TO authenticated;

-- ============================================
-- SYNC series_follows WITH user_library
-- ============================================
-- The app uses user_library for following, so sync it to series_follows

-- Sync existing follows from user_library
INSERT INTO public.series_follows (user_id, series_id, created_at)
SELECT user_id, series_id, created_at
FROM public.user_library
ON CONFLICT (user_id, series_id) DO NOTHING;

-- Create auto-sync trigger
CREATE OR REPLACE FUNCTION sync_library_to_follows()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.series_follows (user_id, series_id, created_at)
    VALUES (NEW.user_id, NEW.series_id, NEW.created_at)
    ON CONFLICT (user_id, series_id) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.series_follows
    WHERE user_id = OLD.user_id AND series_id = OLD.series_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_library_follows ON public.user_library;

CREATE TRIGGER trigger_sync_library_follows
  AFTER INSERT OR DELETE ON public.user_library
  FOR EACH ROW
  EXECUTE FUNCTION sync_library_to_follows();

GRANT EXECUTE ON FUNCTION sync_library_to_follows() TO authenticated;

-- ============================================
-- STEP 3: DIAGNOSTIC CHECKS
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_test_series_id UUID;
  v_notification_count INT;
BEGIN
  v_user_id := auth.uid();
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION SYSTEM DIAGNOSTIC';
  RAISE NOTICE '========================================';
  
  -- Check if logged in
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ NOT LOGGED IN';
    RAISE NOTICE 'Please log in to your app first, then run this script again.';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Logged in as user: %', v_user_id;
  END IF;
  
  -- Check tables
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications') THEN
    RAISE NOTICE '✅ user_notifications table exists';
  ELSE
    RAISE NOTICE '❌ user_notifications table MISSING';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'series_follows') THEN
    RAISE NOTICE '✅ series_follows table exists';
  ELSE
    RAISE NOTICE '❌ series_follows table MISSING';
  END IF;
  
  -- Check trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_notify_new_chapter'
  ) THEN
    RAISE NOTICE '✅ Chapter notification trigger exists';
  ELSE
    RAISE NOTICE '❌ Chapter notification trigger MISSING';
  END IF;
  
  -- Create test notification
  BEGIN
    INSERT INTO user_notifications (user_id, notification_type, title, message, icon)
    VALUES (v_user_id, 'system', '✅ Notification System Active', 'Your notification system is working! Check the bell icon in the navbar.', '🔔');
    RAISE NOTICE '✅ Test notification created successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Failed to create test notification: %', SQLERRM;
  END;
  
  -- Count notifications
  SELECT COUNT(*) INTO v_notification_count 
  FROM user_notifications 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 You have % total notifications', v_notification_count;
  
  -- Check follows
  SELECT COUNT(*) INTO v_notification_count 
  FROM series_follows 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📚 You are following % series', v_notification_count;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE 'Check the bell icon (🔔) in your navbar';
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================
-- STEP 4: SHOW YOUR NOTIFICATIONS
-- ============================================
SELECT 
  CASE 
    WHEN notification_type = 'chapter' THEN '📖'
    WHEN notification_type = 'achievement' THEN '🏆'
    WHEN notification_type = 'system' THEN '🔔'
    WHEN notification_type = 'goal' THEN '🎯'
    ELSE '📬'
  END as icon,
  title,
  message,
  CASE WHEN is_read THEN '✓ Read' ELSE '● Unread' END as status,
  created_at
FROM user_notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
