-- ============================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- ============================================

-- Create carousel_items table
CREATE TABLE IF NOT EXISTS public.carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_carousel_items_position 
  ON public.carousel_items (position ASC) 
  WHERE is_active = true;

-- Function: Check max 10 items limit
CREATE OR REPLACE FUNCTION check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.carousel_items 
        WHERE is_active = true 
        AND id != COALESCE(NEW.id, gen_random_uuid())) >= 10 THEN
      RAISE EXCEPTION 'Maximum 10 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Enforce limit
DROP TRIGGER IF EXISTS trigger_check_carousel_limit ON public.carousel_items;
CREATE TRIGGER trigger_check_carousel_limit
  BEFORE INSERT OR UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION check_carousel_item_limit();

-- Function: Auto-update timestamp
CREATE OR REPLACE FUNCTION update_carousel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on changes
DROP TRIGGER IF EXISTS trigger_update_carousel_timestamp ON public.carousel_items;
CREATE TRIGGER trigger_update_carousel_timestamp
  BEFORE UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_timestamp();

-- Enable Row Level Security
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view active items
DROP POLICY IF EXISTS "Active carousel items are public" ON public.carousel_items;
CREATE POLICY "Active carousel items are public" 
  ON public.carousel_items
  FOR SELECT 
  USING (is_active = true);

-- RLS Policy: Admins can manage all
DROP POLICY IF EXISTS "Admins manage carousel items" ON public.carousel_items;
CREATE POLICY "Admins manage carousel items" 
  ON public.carousel_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT SELECT ON public.carousel_items TO anon;

-- SUCCESS MESSAGE
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CAROUSEL SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Go to /admin/banners to start adding titles';
  RAISE NOTICE '========================================';
END $$;
