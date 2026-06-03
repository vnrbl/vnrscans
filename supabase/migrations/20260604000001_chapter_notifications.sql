-- Create series_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.series_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, series_id)
);

-- Create indexes
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

-- Create notifications for new chapters to followers
-- This trigger sends notifications to all users following a series when a new chapter is published

CREATE OR REPLACE FUNCTION notify_followers_of_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
  series_title TEXT;
  series_slug TEXT;
BEGIN
  -- Only notify if chapter status is 'published' (not draft or scheduled)
  IF NEW.status = 'published' AND (NEW.scheduled_at IS NULL OR NEW.scheduled_at <= NOW()) THEN
    
    -- Get series info
    SELECT title, slug INTO series_title, series_slug
    FROM public.series
    WHERE id = NEW.series_id;
    
    -- Insert notifications for all users following this series
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

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON public.chapters;

-- Create trigger on chapters table
CREATE TRIGGER trigger_notify_new_chapter
  AFTER INSERT OR UPDATE OF status ON public.chapters
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION notify_followers_of_new_chapter();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_series_status ON public.chapters(series_id, status, created_at DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_followers_of_new_chapter() TO authenticated;

COMMENT ON FUNCTION notify_followers_of_new_chapter() IS 'Automatically creates notifications for users following a series when a new chapter is published';

-- ============================================
-- SYNC series_follows WITH user_library
-- ============================================
-- Since the app uses user_library for following, we need to sync it to series_follows

-- Sync existing follows from user_library to series_follows
INSERT INTO public.series_follows (user_id, series_id, created_at)
SELECT user_id, series_id, created_at
FROM public.user_library
ON CONFLICT (user_id, series_id) DO NOTHING;

-- Create trigger to auto-sync new follows
CREATE OR REPLACE FUNCTION sync_library_to_follows()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When user adds to library, add to follows
    INSERT INTO public.series_follows (user_id, series_id, created_at)
    VALUES (NEW.user_id, NEW.series_id, NEW.created_at)
    ON CONFLICT (user_id, series_id) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    -- When user removes from library, remove from follows
    DELETE FROM public.series_follows
    WHERE user_id = OLD.user_id AND series_id = OLD.series_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_library_follows ON public.user_library;

-- Create trigger on user_library
CREATE TRIGGER trigger_sync_library_follows
  AFTER INSERT OR DELETE ON public.user_library
  FOR EACH ROW
  EXECUTE FUNCTION sync_library_to_follows();

GRANT EXECUTE ON FUNCTION sync_library_to_follows() TO authenticated;
