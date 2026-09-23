import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1200),
  })).min(1).max(12),
});

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = requestCounts.get(ip);
  if (current && current.resetAt > now && current.count >= 20) {
    return NextResponse.json({ error: "Chat limit reached. Please try again later." }, { status: 429 });
  }
  requestCounts.set(ip, !current || current.resetAt <= now ? { count: 1, resetAt: now + 60 * 60 * 1000 } : { ...current, count: current.count + 1 });

  try {
    const parsed = ChatSchema.safeParse(await request.json());
    if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
      return NextResponse.json({ error: "Please send a valid message." }, { status: 400 });
    }

    const workerUrl = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;
    const proxySecret = process.env.AI_PROXY_SECRET;
    if (!workerUrl || !proxySecret) {
      return NextResponse.json({ error: "The assistant is not configured yet." }, { status: 503 });
    }

    const response = await fetch(`${workerUrl.replace(/\/$/, "")}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Proxy-Secret": proxySecret,
        "X-Client-IP": request.headers.get("x-real-ip") || ip,
      },
      body: JSON.stringify({ messages: parsed.data.messages.slice(-8) }),
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as { reply?: string; error?: string };
    if (!response.ok || !result.reply) {
      return NextResponse.json({ error: result.error || "The assistant is temporarily unavailable." }, { status: response.status || 502 });
    }
    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    console.error("[/api/ai-chat] request failed", error);
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 502 });
  }
}
