-- Update homepage carousel active title limit to 30.
DROP TRIGGER IF EXISTS trigger_check_carousel_limit ON public.carousel_items;
DROP FUNCTION IF EXISTS public.check_carousel_item_limit();

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

CREATE TRIGGER trigger_check_carousel_limit
  BEFORE INSERT OR UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_carousel_item_limit();
