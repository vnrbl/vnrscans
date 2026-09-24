import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function matchesSecret(supplied: string, expected: string) {
  if (supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  return handleGuestCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleGuestCleanup(req);
}

/**
 * Deletes anonymous ("guest") auth users that were never upgraded to a real
 * email account. Delegates to the SECURITY DEFINER RPC `public.
 * cleanup_stale_guests(p_older_than_days)` (see migration
 * 20260924120000/20260924130100): deletes auth.users rows where
 * is_anonymous = true AND created_at < now() - N days, batched 500 per run
 * with per-row exception recovery. Upgraded guests are untouched — Supabase
 * flips is_anonymous to false on updateUser(email, password).
 *
 * Scheduled daily at 04:00 UTC via vercel.json crons (pg_cron is not
 * available on this project). Vercel Cron sends the CRON_SECRET bearer
 * token automatically when CRON_SECRET is set in the project env.
 */
async function handleGuestCleanup(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    const providedSecret = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (
      !expectedSecret ||
      expectedSecret.length < 32 ||
      !providedSecret ||
      !matchesSecret(providedSecret, expectedSecret)
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsedDays = Number(searchParams.get("olderThanDays") ?? 30);
    const olderThanDays =
      Number.isFinite(parsedDays) && parsedDays >= 0 ? Math.floor(parsedDays) : 30;

    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin.rpc("cleanup_stale_guests", {
      p_older_than_days: olderThanDays,
    });

    if (error) {
      console.error("[CronCleanupGuests] RPC failed:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = Array.isArray(data)
      ? Number((data[0] as { deleted_count?: number } | undefined)?.deleted_count ?? 0)
      : 0;

    return NextResponse.json({
      success: true,
      olderThanDays,
      deletedCount,
      ranAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CronCleanupGuests] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Guest cleanup failed" },
      { status: 500 }
    );
  }
}
