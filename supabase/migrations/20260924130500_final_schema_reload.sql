-- Final PostgREST schema-cache reload, placed AFTER all object-creating
-- migrations in this batch so the cache picks up cleanup_stale_guests and
-- _migration_diagnostics. (An earlier NOTIFY ran before those objects existed.)
NOTIFY pgrst, 'reload schema';
NOTIFY postgrest, 'reload schema';
