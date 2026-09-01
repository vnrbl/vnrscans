import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNewUserNotification } from "@/lib/email";

// This endpoint can be called right after a successful client-side signUp.
// If WORKER_URL is set, it will prefer the Cloudflare Worker.

const SignupNotifySchema = z.object({
  email: z.string().email(),
  userId: z.string().uuid().optional(),
  username: z.string().optional(),
});

const WORKER_URL = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupNotifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { email, userId, username } = parsed.data;
    const payload = {
      email,
      userId: userId || "unknown",
      username: username || null,
      created_at: new Date().toISOString(),
    };

    // Prefer Cloudflare Worker when configured
    if (WORKER_URL) {
      fetch(`${WORKER_URL.replace(/\/$/, "")}/email/new-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("[notify-signup] worker forward failed (non-fatal):", e));

      return NextResponse.json({ success: true, via: "worker" });
    }

    // Direct Resend fallback
    sendNewUserNotification({
      email,
      username: username || null,
      userId: userId || "unknown",
      createdAt: new Date().toISOString(),
    }).catch((e) => console.error("[notify-signup] send failed:", e));

    return NextResponse.json({ success: true, via: "direct" });
  } catch (err) {
    console.error("[/api/notify-signup] error:", err);
    return NextResponse.json({ success: true }); // don't fail the UX
  }
}
