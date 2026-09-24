-- ─────────────────────────────────────────────────────────────────────────────
-- Ensure guest auto-cleanup function exists.
-- Companion to 20260924120000_guest_auto_cleanup.sql. Re-created here
-- idempotently in case the earlier batched push rolled back.
-- ─────────────────────────────────────────────────────────────────────────────

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

  for r in
    select id
    from auth.users
    where is_anonymous is true
      and created_at < v_cutoff
    limit 500
  loop
    begin
      delete from auth.users where id = r.id;
      v_deleted := v_deleted + 1;
    exception when others then
      raise warning 'cleanup_stale_guests: failed to delete user %: %', r.id, sqlerrm;
    end;
  end loop;

  return query select v_deleted;
end;
$$;

revoke execute on function public.cleanup_stale_guests(int) from anon, authenticated;
grant execute on function public.cleanup_stale_guests(int) to service_role;

-- Schedule with pg_cron when available (idempotent re-schedule).
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
    raise notice 'pg_cron schedule ensured: cleanup-stale-guests-daily (04:00 UTC)';
  else
    raise notice 'pg_cron not installed — call cleanup_stale_guests(30) from an external cron instead.';
  end if;
end $$;
