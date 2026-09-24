-- Make cleanup_stale_guests visible in the PostgREST schema cache.
--
-- PostgREST filters RPCs by EXECUTE privilege; revoking from anon/authenticated
-- can hide the function from the (shared) schema cache even for service_role.
-- Security stays enforced INSIDE the function body: it raises unless
-- current_user is postgres/service_role/supabase_admin, so anon/authenticated
-- callers get a clean privilege error, not a result.

grant execute on function public.cleanup_stale_guests(int) to anon, authenticated, service_role;

-- Reload both possible PostgREST notify channels.
NOTIFY pgrst, 'reload schema';
NOTIFY postgrest, 'reload schema';
