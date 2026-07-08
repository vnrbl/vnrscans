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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    console.log("[/api/contact] Received submission for", data.email, "WORKER_URL set?", !!WORKER_URL);

    // If WORKER_URL is set, forward to Cloudflare Worker (preferred for emails)
    if (WORKER_URL) {
      try {
        const workerRes = await fetch(`${WORKER_URL.replace(/\/$/, "")}/email/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = (await workerRes.json()) as { success?: boolean; error?: string; id?: string };
        console.log("[/api/contact] Worker response:", { status: workerRes.status, result });

        if (workerRes.ok && result.success) {
          return NextResponse.json({ success: true, via: "worker", id: result.id });
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

    return NextResponse.json({ success: true, via: "direct", id: result.id });
  } catch (err: any) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
