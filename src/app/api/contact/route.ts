import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactFormEmail } from "@/lib/email";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(150),
  message: z.string().min(5).max(5000),
  inquiryType: z.string().max(100).optional(),
});

const WORKER_URL = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;

function createContactNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CT-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function sendTelegramContactAlert(data: z.infer<typeof ContactSchema>, contactNo: string) {
  const secret = process.env.TELEGRAM_ACTION_SECRET;
  if (!WORKER_URL || !secret) {
    console.warn("[/api/contact] Telegram contact alert is not configured");
    return;
  }

  try {
    const response = await fetch(`${WORKER_URL.replace(/\/$/, "")}/telegram/contact-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Site-Action-Secret": secret },
      body: JSON.stringify({ ...data, contactNo }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.warn("[/api/contact] Telegram contact alert was not delivered immediately", { status: response.status, contactNo });
    }
  } catch (error) {
    console.warn("[/api/contact] Telegram contact alert request failed", { contactNo, error: error instanceof Error ? error.message : "unknown error" });
  }
}

// Simple in-memory sliding window rate limiter (max 5 requests per 10 minutes per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const limit = 5;

    const record = rateLimitMap.get(ip);
    if (record) {
      if (now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      } else if (record.count >= limit) {
        return NextResponse.json(
          { error: "Too many requests. Please try again in a few minutes." },
          { status: 429 }
        );
      } else {
        record.count++;
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    }

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const contactNo = createContactNo();
    console.log("[/api/contact] Received submission for", data.email, "WORKER_URL set?", !!WORKER_URL);

    // If WORKER_URL is set, forward to Cloudflare Worker (preferred for emails)
    if (WORKER_URL) {
      try {
        const workerRes = await fetch(`${WORKER_URL.replace(/\/$/, "")}/email/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, contactNo }),
        });

        const result = (await workerRes.json()) as { success?: boolean; error?: string; id?: string };
        console.log("[/api/contact] Worker response:", { status: workerRes.status, result });

        if (workerRes.ok && result.success) {
          await sendTelegramContactAlert(data, contactNo);
          return NextResponse.json({ success: true, via: "worker", id: result.id, contactNo });
        }
        // Fall through to direct if worker failed
        console.warn("[/api/contact] Worker failed, falling back to direct:", result);
      } catch (e) {
        console.warn("[/api/contact] Could not reach Worker, using direct Resend:", e);
      }
    }

    // Direct Resend (fallback / local dev)
    const result = await sendContactFormEmail({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      inquiryType: data.inquiryType,
    });

    console.log("[/api/contact] Direct send result:", result);

    if (!result.success) {
      console.error("[/api/contact] Direct send failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }

    await sendTelegramContactAlert(data, contactNo);
    return NextResponse.json({ success: true, via: "direct", id: result.id, contactNo });
  } catch (err: any) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
