import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNewUserNotification } from "@/lib/email";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.SUPABASE_WEBHOOK_SECRET;
const WORKER_URL = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;

const NewUserPayloadSchema = z.object({
  type: z.string().optional(),
  table: z.string().optional(),
  record: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    raw_user_meta_data: z.record(z.any()).optional(),
    created_at: z.string().optional(),
    // Supabase auth.users shape when using DB webhook
  }).passthrough(),
  // Also support direct calls from client after signup
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Enforce secret verification when configured
    if (WEBHOOK_SECRET) {
      const incomingSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-supabase-webhook-secret") ||
        "";

      if (incomingSecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized: Invalid or missing webhook secret" }, { status: 401 });
      }
    }

    const body = await req.json();
    const parsed = NewUserPayloadSchema.safeParse(body);

    if (!parsed.success) {
      // Try to be lenient for direct calls
      console.warn("[webhook/new-user] payload validation failed, trying fallback");
    }

    let email: string | undefined;
    let userId: string | undefined;
    let username: string | undefined;
    let createdAt: string | undefined;

    const data: any = parsed.success ? parsed.data : body;

    // Supabase DB Webhook format (table record)
    if (data.record?.email) {
      email = data.record.email;
      userId = data.record.id;
      username = data.record.raw_user_meta_data?.username || null;
      createdAt = data.record.created_at;
    }
    // Direct call format (after client signup)
    else if (data.email) {
      email = data.email;
      userId = data.user_id;
      username = data.username;
      createdAt = new Date().toISOString();
    }

    if (!email || !userId) {
      return NextResponse.json({ error: "Missing required fields (email, user_id)" }, { status: 400 });
    }

    // Forward to Cloudflare Worker if configured (best for reliability + rate limiting)
    if (WORKER_URL) {
      fetch(`${WORKER_URL.replace(/\/$/, "")}/webhook/new-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify({ record: { id: userId, email, raw_user_meta_data: { username }, created_at: createdAt } }),
      }).catch(() => { /* non-blocking */ });

      return NextResponse.json({ success: true, via: "worker" });
    }

    // Direct fallback
    const result = await sendNewUserNotification({
      email,
      username,
      userId,
      createdAt,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[/api/webhooks/new-user] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
