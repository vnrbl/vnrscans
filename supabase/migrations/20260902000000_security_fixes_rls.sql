-- Security hardening migration: Prevent privilege escalation, RLS bypass, and unauthorized data injection.

-- 1. Remove is_banned, ban_reason, banned_at from the authenticated role's UPDATE grant on profiles.
-- Moderation ban/unban must only be performed through verified server actions / service role.
REVOKE UPDATE (is_banned, ban_reason, banned_at) ON public.profiles FROM authenticated;

-- 2. Update the guard_profile_privileged_columns trigger to strictly block client-side updates to moderation and authoritative columns.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_role text;
BEGIN
  -- Service role and postgres connection bypass checks
  acting_role := current_setting('role', true);
  IF acting_role IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- INSERT checks: A client must not set authoritative or privileged columns
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

  -- UPDATE checks: Regular authenticated users may not modify authoritative or moderation columns on their own row
  IF NEW.is_vip IS DISTINCT FROM OLD.is_vip THEN
    RAISE EXCEPTION 'Not allowed to modify is_vip' USING ERRCODE = '42501';
  END IF;
  IF NEW.experience_points IS DISTINCT FROM OLD.experience_points THEN
    RAISE EXCEPTION 'Not allowed to modify experience_points' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_level IS DISTINCT FROM OLD.user_level THEN
    RAISE EXCEPTION 'Not allowed to modify user_level' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'Not allowed to modify is_banned' USING ERRCODE = '42501';
  END IF;
  IF NEW.ban_reason IS DISTINCT FROM OLD.ban_reason THEN
    RAISE EXCEPTION 'Not allowed to modify ban_reason' USING ERRCODE = '42501';
  END IF;
  IF NEW.banned_at IS DISTINCT FROM OLD.banned_at THEN
    RAISE EXCEPTION 'Not allowed to modify banned_at' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_columns ON public.profiles;
CREATE TRIGGER trigger_guard_profile_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- 3. Fix user_notifications INSERT policy to prevent cross-user forged notification injection
DROP POLICY IF EXISTS "System creates notifications" ON public.user_notifications;
CREATE POLICY "Authorized notification insert" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 4. Fix user_milestones INSERT policy to prevent milestone forging
DROP POLICY IF EXISTS "System creates milestones" ON public.user_milestones;
CREATE POLICY "Authorized milestone insert" ON public.user_milestones
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
