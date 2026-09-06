import { NextRequest, NextResponse } from "next/server";
import { assertSafePublicUrl } from "@/lib/ssrf-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // SSRF security check
    try {
      assertSafePublicUrl(url);
    } catch {
      return new NextResponse("Invalid or restricted URL", { status: 403 });
    }

    // Forward request with required headers for hotlink-protected hosts like wowpic1.store
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    };

    if (url.includes("wowpic1.store") || url.includes("wowpic") || url.includes("comix.to")) {
      headers["Referer"] = "https://comix.to/";
    }

    const upstreamRes = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(20_000),
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/webp";
    const imageBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, stale-while-revalidate=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[ImageProxy] Error proxying image:", err);
    return new NextResponse(err.message || "Failed to fetch image", { status: 502 });
  }
}
