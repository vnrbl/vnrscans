import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GifItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  width?: number;
  height?: number;
  source?: string;
}

// In-memory cache for fast repeated queries (10 minutes TTL)
const cache = new Map<string, { timestamp: number; data: GifItem[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const query = rawQuery || "anime reaction";
    const cacheKey = query.toLowerCase();

    // Check in-memory cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ gifs: cached.data, cached: true }, {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      });
    }

    // DuckDuckGo GIF live search
    // 1. Fetch vqd token
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query + " gif")}&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ gifs: [], error: "Failed to initialize search token" }, { status: 502 });
    }

    const html = await tokenRes.text();
    const match = html.match(/vqd=["']?([^&"'\s]+)/);
    const vqd = match ? match[1] : null;

    if (!vqd) {
      return NextResponse.json({ gifs: [], error: "Search token not found" }, { status: 502 });
    }

    // 2. Fetch live GIF items
    const imgUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query + " gif")}&vqd=${vqd}&f=type:gif&p=1`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
      },
    });

    if (!imgRes.ok) {
      return NextResponse.json({ gifs: [], error: "Failed to fetch image results" }, { status: 502 });
    }

    const json = (await imgRes.json()) as any;
    const results = json.results || [];

    const gifs: GifItem[] = results
      .filter((r: any) => r.image && typeof r.image === "string")
      .map((r: any, idx: number) => {
        return {
          id: `gif-${idx}-${Buffer.from(r.image).toString("base64").slice(0, 10)}`,
          title: cleanTitle(r.title || query),
          url: r.image,
          thumbnail: r.thumbnail || r.image,
          width: r.width,
          height: r.height,
          source: r.source,
        };
      })
      .slice(0, 32);

    // Save in cache
    if (gifs.length > 0) {
      // Limit cache size to 100 queries
      if (cache.size > 100) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { timestamp: Date.now(), data: gifs });
    }

    return NextResponse.json(
      { gifs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error: any) {
    console.error("GIF live search error:", error);
    return NextResponse.json({ gifs: [], error: error?.message || "Search failed" }, { status: 500 });
  }
}

function cleanTitle(title: string): string {
  return title
    .replace(/GIF\s*-\s*Find & Share on GIPHY/gi, "")
    .replace(/GIF\s*-\s*Discover & Share GIFs/gi, "")
    .replace(/\s*\|\s*GIFDB\.com/gi, "")
    .replace(/\s*-\s*Tenor/gi, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}
