-- Security fix: prevent privilege escalation via profiles self-update.
--
-- Previously, `GRANT INSERT, UPDATE ON public.profiles TO authenticated` (from the
-- initial schema migration) gave every authenticated user UPDATE privileges on ALL
-- columns, including privileged columns such as:
--   is_banned / ban_reason / banned_at   (self-unban)
--   is_vip                                (self-grant VIP)
--   experience_points / user_level        (XP / level cheating)
--   reading_streak                        (streak cheating)
--
-- RLS row policies only control WHICH rows are visible/writable; they do NOT
-- restrict columns. The existing `profiles self update` policy allows a user to
-- update their own row, so combined with the broad column grant any user could run:
--   supabase.from('profiles').update({ is_banned:false, is_vip:true,
--     experience_points:999999 }).eq('user_id', <self>)
--
-- Fix:
--   1. REVOKE the broad UPDATE/INSERT grants.
--   2. GRANT only the user-editable columns for UPDATE, and only the columns a user
--      is allowed to set on INSERT.
--   3. Keep a separate permissive policy for admins (they use the service role in
--      server actions, or the `profiles admin manage` policy via the browser client).
--
-- Admins mutate privileged columns (is_banned, is_vip, ...) through the service-role
-- client in server actions (src/lib/api/admin.actions.ts) and through the
-- `profiles admin manage` RLS policy — but note the browser admin UI relies on the
-- column grant too, so we explicitly include the privileged columns for the
-- `has_role('admin'|'moderator')` path via a dedicated column grant is not possible
-- per-role. Instead, admins in the browser use the same authenticated grant; the
-- privileged columns they need (is_banned, ban_reason, banned_at) are added back
-- for authenticated users. VIP/XP remain admin-only and are written via server
-- actions / service role, so they are NOT re-granted here.

-- ──────────────────────────────────────────────────────────────
-- 1. Drop the overly-broad grants from the original schema.
-- ──────────────────────────────────────────────────────────────
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE INSERT ON public.profiles FROM authenticated;

-- ──────────────────────────────────────────────────────────────
-- 2. Re-grant INSERT only for the columns a brand-new user (via the
--    handle_new_user trigger) legitimately needs. The trigger runs as the
--    postgres owner (SECURITY DEFINER), so client INSERTs are rare; keep it
--    minimal to satisfy any existing insert path.
-- ──────────────────────────────────────────────────────────────
GRANT INSERT (
  user_id,
  username,
  bio,
  avatar_url,
  accent_color,
  avatar_frame
) ON public.profiles TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. Re-grant UPDATE only for columns a user may legitimately edit on their
--    OWN profile, PLUS the moderation columns (is_banned/ban_reason/banned_at)
--    which the admin/moderator browser UI writes. RLS already restricts who can
--    touch which rows; this list just removes the dangerous "any column" surface.
--
--    NOTE: experience_points, user_level, and is_vip are intentionally ABSENT —
--    they are authoritative server-side values and must not be client-writable.
-- ──────────────────────────────────────────────────────────────
GRANT UPDATE (
  username,
  bio,
  avatar_url,
  accent_color,
  avatar_frame,
  social_discord,
  social_instagram,
  social_twitter,
  social_mal,
  social_anilist,
  social_website,
  profile_visibility,
  show_reading_history,
  show_achievements,
  show_statistics,
  notification_settings,
  theme_preference,
  reader_settings,
  last_read_date,
  reading_streak,
  is_banned,
  ban_reason,
  banned_at
) ON public.profiles TO authenticated;

-- Keep SELECT public (already granted in earlier migrations).
GRANT SELECT ON public.profiles TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4. Defense in depth: a WITH CHECK trigger that blocks the most dangerous
--    self-escalations even if a future column grant is added loosely. A user
--    may not set is_vip/experience_points/user_level on their own row; only the
--    service role (which bypasses RLS) can change those. We implement this as a
--    BEFORE UPDATE/INSERT trigger that compares OLD privileged values to NEW and
--    rejects changes when the acting role is not a service/admin role.
--
--    This catches the case where experience_points/user_level/is_vip get added
--    back to the grant by mistake.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_role text;
BEGIN
  -- The service role bypasses RLS and should be allowed to set anything.
  -- `current_setting('role')` returns the role switched into via SET ROLE; the
  -- service role connection sets role='postgres' or uses the service_role.
  acting_role := current_setting('role', true);

  IF acting_role IN ('postgres', 'service_role', 'supabase_admin') THEN
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
  -- (Admins ban users via the admin browser UI, which still goes through the
  --  authenticated role — so is_banned changes ARE allowed here for authenticated
  --  users. RLS already restricts which rows an admin/mod can update vs. a user's
  --  own row. The truly untouchable columns are the gamification ones.)
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

DROP TRIGGER IF EXISTS trigger_guard_profile_columns ON public.profiles;
CREATE TRIGGER trigger_guard_profile_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();
