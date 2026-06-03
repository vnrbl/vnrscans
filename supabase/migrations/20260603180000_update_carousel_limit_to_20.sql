-- Update carousel items limit from 10 to 20
CREATE OR REPLACE FUNCTION check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.carousel_items WHERE is_active = true AND id != COALESCE(NEW.id, gen_random_uuid())) >= 20 THEN
      RAISE EXCEPTION 'Maximum 20 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists, just updating the function
