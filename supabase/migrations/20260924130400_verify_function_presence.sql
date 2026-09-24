-- Diagnostic: verify whether cleanup_stale_guests exists in the database.
-- Creates a tiny table readable via the REST API so verification doesn't need
-- direct DB access. Safe to drop later.

create table if not exists public._migration_diagnostics (
  key text primary key,
  value text,
  checked_at timestamptz default now()
);

do $$
declare
  v_count int;
  v_args text;
begin
  select count(*), coalesce(max(pg_get_function_identity_arguments(oid)), 'none')
    into v_count, v_args
  from pg_proc
  where proname = 'cleanup_stale_guests'
    and pronamespace = 'public'::regnamespace;

  insert into public._migration_diagnostics (key, value)
  values ('cleanup_stale_guests_count', v_count::text),
         ('cleanup_stale_guests_args', v_args),
         ('pg_cron_installed', (exists (select 1 from pg_extension where extname = 'pg_cron'))::text),
         ('pg_trgm_installed', (exists (select 1 from pg_extension where extname = 'pg_trgm'))::text)
  on conflict (key) do update set value = excluded.value, checked_at = now();
end $$;

grant select on public._migration_diagnostics to service_role;
