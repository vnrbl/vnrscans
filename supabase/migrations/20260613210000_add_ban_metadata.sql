-- Ban metadata for admin user moderation.
-- NOTE: is_banned was declared in 20260603140000_admin_platform_features.sql but was
-- not actually present in the live database (verified via information_schema), so the
-- moderation "ban user" action was silently failing. Re-add it here idempotently
-- alongside the new reason/timestamp columns.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
