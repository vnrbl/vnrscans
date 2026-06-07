-- ============================================
-- UPDATE CAROUSEL LIMIT TO 30
-- ============================================
-- Run this in Supabase SQL Editor

-- Update the trigger function to allow 30 active items.
CREATE OR REPLACE FUNCTION check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.carousel_items
        WHERE is_active = true
        AND id != COALESCE(NEW.id, gen_random_uuid())) >= 30 THEN
      RAISE EXCEPTION 'Maximum 30 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Carousel limit updated to 30 items!';
END $$;
