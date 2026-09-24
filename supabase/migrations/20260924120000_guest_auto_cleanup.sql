-- ─────────────────────────────────────────────────────────────────────────────
-- Guest account auto-cleanup
--
-- Guests sign in via Supabase anonymous sign-ins (auth.users.is_anonymous).
-- When a guest upgrades (adds email/password via auth.updateUser), Supabase
-- flips is_anonymous to false on the SAME row — progress is preserved.
--
-- Policy: delete guest accounts 30 days after creation UNLESS they have been
-- upgraded (bound to an email / identity). Deleting the auth.users row
-- cascades to public tables whose user_id FKs are ON DELETE CASCADE
-- (chapter_reactions, xp_transactions). Tables without FKs keep orphan rows
-- intentionally — they are harmless and preserve aggregate stats (comment
-- counts on series, chapter like counts, etc. are computed from surviving
-- rows only where the FK exists; counters elsewhere simply ignore the
-- missing user).
--
-- Scheduling: pg_cron daily at 04:00 UTC. If pg_cron is unavailable on the
-- project, the cleanup RPC `cleanup_stale_guests()` is safe to call manually
-- or from an external cron (Vercel Cron / GitHub Action) with the service key.
-- ─────────────────────────────────────────────────────────────────────────────

-- Guard: allow only service role (the cron job and admin scripts) to run this.
create or replace function public.cleanup_stale_guests(
  p_older_than_days int default 30
)
returns table (deleted_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz;
  v_deleted bigint := 0;
  r record;
begin
  -- Only the service role / postgres may run this.
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'cleanup_stale_guests: insufficient privileges';
  end if;

  v_cutoff := now() - make_interval(days => p_older_than_days);

  -- Loop over stale guests one-by-one so a single bad row can't abort the batch.
  for r in
    select id
    from auth.users
    where is_anonymous is true
      and created_at < v_cutoff
    limit 500  -- batch cap: keep each run short and transaction-safe
  loop
    begin
      delete from auth.users where id = r.id;
      v_deleted := v_deleted + 1;
    exception when others then
      -- Log and continue; the next run will retry any stragglers.
      raise warning 'cleanup_stale_guests: failed to delete user %: %', r.id, sqlerrm;
    end;
  end loop;

  return query select v_deleted;
end;
$$;

-- Grant execute to service_role only (used by pg_cron and admin tooling).
revoke execute on function public.cleanup_stale_guests(int) from anon, authenticated;
grant execute on function public.cleanup_stale_guests(int) to service_role;

-- ── Schedule with pg_cron (daily 04:00 UTC) ──────────────────────────────────
-- pg_cron lives in the 'extensions'/'pg_catalog' schema depending on project;
-- create the schedule defensively and fail soft if pg_cron is not installed.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('cleanup-stale-guests-daily')
      where exists (select 1 from cron.job where jobname = 'cleanup-stale-guests-daily');
    perform cron.schedule(
      'cleanup-stale-guests-daily',
      '0 4 * * *',
      $cron$ select * from public.cleanup_stale_guests(30); $cron$
    );
    raise notice 'pg_cron schedule created: cleanup-stale-guests-daily (04:00 UTC)';
  else
    raise notice 'pg_cron not installed — schedule cleanup_stale_guests(30) externally (Vercel Cron / manual).';
  end if;
end $$;
