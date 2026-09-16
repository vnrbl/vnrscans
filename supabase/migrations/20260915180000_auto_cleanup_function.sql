-- Auto-cleanup function to prevent future database bloat
-- Callable via: SELECT public.cleanup_old_data();
-- Or via RPC: supabase.rpc('cleanup_old_data')

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_sessions integer := 0;
  v_deleted_xp integer := 0;
  v_deleted_logs integer := 0;
  v_deleted_notifications integer := 0;
  v_deleted_recycle integer := 0;
  v_deleted_analytics integer := 0;
  v_deleted_announcements integer := 0;
  v_deleted_history integer := 0;
  v_deleted_import_items integer := 0;
  v_deleted_import_logs integer := 0;
BEGIN
  -- 1. Reading sessions > 30 days
  DELETE FROM reading_sessions WHERE started_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted_sessions = ROW_COUNT;

  -- 2. XP transactions > 90 days (totals are on profiles, safe to delete history)
  DELETE FROM xp_transactions WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_deleted_xp = ROW_COUNT;

  -- 3. Admin activity logs > 30 days
  DELETE FROM admin_activity_logs WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;

  -- 4. Read notifications > 14 days, all notifications > 30 days
  DELETE FROM user_notifications 
  WHERE (is_read = true AND created_at < now() - interval '14 days')
     OR created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted_notifications = ROW_COUNT;

  -- 5. Expired recycle bin items
  DELETE FROM recycle_bin WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted_recycle = ROW_COUNT;

  -- 6. Old analytics > 30 days
  DELETE FROM daily_analytics WHERE date < CURRENT_DATE - 30;
  DELETE FROM series_analytics WHERE date < CURRENT_DATE - 30;
  GET DIAGNOSTICS v_deleted_analytics = ROW_COUNT;

  -- 7. Old announcement read receipts > 7 days
  DELETE FROM user_announcements WHERE read_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted_announcements = ROW_COUNT;

  -- 8. Low-progress reading history (accidental opens)
  DELETE FROM reading_history
  WHERE progress < 5 AND updated_at < now() - interval '7 days' AND xp_awarded = false;
  GET DIAGNOSTICS v_deleted_history = ROW_COUNT;

  -- 9. Completed/failed site import items > 7 days
  DELETE FROM site_import_items 
  WHERE status IN ('completed', 'failed', 'duplicate')
     OR created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted_import_items = ROW_COUNT;

  -- 10. Old import logs > 30 days
  DELETE FROM series_import_logs WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted_import_logs = ROW_COUNT;

  RETURN jsonb_build_object(
    'cleaned_at', now(),
    'deleted', jsonb_build_object(
      'reading_sessions', v_deleted_sessions,
      'xp_transactions', v_deleted_xp,
      'admin_activity_logs', v_deleted_logs,
      'user_notifications', v_deleted_notifications,
      'recycle_bin', v_deleted_recycle,
      'analytics', v_deleted_analytics,
      'user_announcements', v_deleted_announcements,
      'reading_history', v_deleted_history,
      'site_import_items', v_deleted_import_items,
      'series_import_logs', v_deleted_import_logs
    )
  );
END;
$$;

-- Allow authenticated users to call it (the function uses SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO authenticated;
