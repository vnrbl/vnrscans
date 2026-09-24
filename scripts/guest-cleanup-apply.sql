-- ═════════════════════════════════════════════════════════════════════════════
-- PASTE THIS INTO: Supabase Dashboard → SQL Editor (project nzxrshkpjdkrbnsonxos)
--
-- WHY: the CLI in this repo is linked to a different project (edvqhmvqbtujzcfqkrbe
-- "Zer0verse", another Supabase account). The app (local + Vercel) uses the
-- project in .env → nzxrshkpjdkrbnsonxos. This script applies the guest
-- auto-cleanup there. It is idempotent — safe to run more than once.
--
-- AFTER RUNNING: the RPC public.cleanup_stale_guests(p_older_than_days := 30)
-- is callable by service_role only, and the Vercel Cron route
-- /api/cron/cleanup-guests (daily 04:00 UTC) will delete un-upgraded guest
-- accounts older than 30 days.
-- ═════════════════════════════════════════════════════════════════════════════

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

-- Only the service role (Vercel Cron route / admin tooling) may execute it.
revoke execute on function public.cleanup_stale_guests(int) from anon, authenticated;
grant execute on function public.cleanup_stale_guests(int) to service_role;

-- If pg_cron happens to be installed, also schedule it daily at 04:00 UTC.
-- Soft-fails with a NOTICE when pg_cron is not available (Vercel Cron covers it).
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
    raise notice 'pg_cron not installed — Vercel Cron route /api/cron/cleanup-guests handles scheduling.';
  end if;
end $$;

-- Rebuild PostgREST's schema cache so the RPC is callable immediately.
notify pgrst, 'reload schema';
