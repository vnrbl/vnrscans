-- ─────────────────────────────────────────────────────────────────────────────
-- Guest cleanup hardening.
--
-- cleanup_stale_guests is SECURITY DEFINER (runs as its owner, postgres), so
-- its in-body current_user guard always passes. The real access gate is the
-- EXECUTE privilege list. Restrict it to service_role (used by pg_cron — if it
-- gets enabled later — and the Vercel Cron route /api/cron/cleanup-guests) and
-- remove the anonymous/authenticated grants added in 20260924130300 only to
-- debug a stale PostgREST schema cache.
--
-- Also drops the temporary public._migration_diagnostics debug table.
--
-- Note: no cron.schedule here — this project does not have pg_cron installed
-- (verified: extension absent). Daily 04:00 UTC scheduling is handled by the
-- Vercel Cron job in vercel.json hitting /api/cron/cleanup-guests.
-- ─────────────────────────────────────────────────────────────────────────────

revoke execute on function public.cleanup_stale_guests(int) from anon, authenticated;
grant execute on function public.cleanup_stale_guests(int) to service_role;

drop table if exists public._migration_diagnostics;
