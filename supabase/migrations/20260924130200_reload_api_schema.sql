-- Force PostgREST to reload its schema cache so newly created RPCs
-- (cleanup_stale_guests) become visible through the REST API.
NOTIFY pgrst, 'reload schema';
