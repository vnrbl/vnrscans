-- Redefine public.guard_profile_privileged_columns to allow SECURITY DEFINER context (like XP triggers) to modify experience points
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_role text;
BEGIN
  -- Switch check: allow if either current_setting('role') or CURRENT_USER is one of the privileged admin/system roles.
  -- This allows SECURITY DEFINER functions (owned by postgres) to modify experience_points/user_level
  -- while still blocking direct client-side updates (which run as 'authenticated' or 'anon').
  acting_role := current_setting('role', true);

  IF CURRENT_USER IN ('postgres', 'service_role', 'supabase_admin') OR acting_role IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- INSERT: a client must not seed authoritative gamification/admin columns.
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_vip IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Not allowed to set is_vip' USING ERRCODE = '42501';
    END IF;
    IF NEW.experience_points IS DISTINCT FROM 0 THEN
      RAISE EXCEPTION 'Not allowed to set experience_points' USING ERRCODE = '42501';
    END IF;
    IF NEW.user_level IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'Not allowed to set user_level' USING ERRCODE = '42501';
    END IF;
    IF NEW.is_banned IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Not allowed to set is_banned' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: a non-service client may not change authoritative columns.
  IF NEW.is_vip IS DISTINCT FROM OLD.is_vip THEN
    RAISE EXCEPTION 'Not allowed to modify is_vip' USING ERRCODE = '42501';
  END IF;
  IF NEW.experience_points IS DISTINCT FROM OLD.experience_points THEN
    RAISE EXCEPTION 'Not allowed to modify experience_points' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_level IS DISTINCT FROM OLD.user_level THEN
    RAISE EXCEPTION 'Not allowed to modify user_level' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
