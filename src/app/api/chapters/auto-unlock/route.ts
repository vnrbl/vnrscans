import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const nowIso = new Date().toISOString();
    const { data: unlocked, error } = await supabaseAdmin
      .from("chapters")
      .update({ status: "published", scheduled_at: null })
      .eq("status", "scheduled")
      .lte("scheduled_at", nowIso)
      .select("id, chapter_number, series_id");

    if (error) {
      console.error("auto-unlock error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      unlockedCount: unlocked?.length || 0,
      unlocked,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
