-- Update homepage carousel active title limit from 20 to 30.
CREATE OR REPLACE FUNCTION public.check_carousel_item_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (
      SELECT COUNT(*)
      FROM public.carousel_items
      WHERE is_active = true
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) >= 30 THEN
      RAISE EXCEPTION 'Maximum 30 active carousel items allowed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
