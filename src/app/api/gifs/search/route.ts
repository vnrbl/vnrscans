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

// In-memory cache for fast repeated queries (15 minutes TTL)
const cache = new Map<string, { timestamp: number; data: GifItem[] }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Curated high-energy anime & reaction fallback memes if external scrapers are temporarily down
const CURATED_MEME_LIBRARY: Record<string, GifItem[]> = {
  hype: [
    {
      id: "curated-hype-1",
      title: "Super Saiyan Power Up",
      url: "https://media.tenor.com/bap5a8lToAwAAAAM/spongebob-squarepants-squidward-tentacles.gif",
      thumbnail: "https://media.tenor.com/bap5a8lToAwAAAAM/spongebob-squarepants-squidward-tentacles.gif",
      source: "Tenor",
    },
    {
      id: "curated-hype-2",
      title: "Absolute Cinema Clap",
      url: "https://media.tenor.com/-GLxXYXKdlAAAAAM/cinema-absolute.gif",
      thumbnail: "https://media.tenor.com/-GLxXYXKdlAAAAAM/cinema-absolute.gif",
      source: "Tenor",
    },
    {
      id: "curated-hype-3",
      title: "Hype Screaming",
      url: "https://media.tenor.com/A0fIBp_rGcQAAAAM/hype.gif",
      thumbnail: "https://media.tenor.com/A0fIBp_rGcQAAAAM/hype.gif",
      source: "Tenor",
    },
    {
      id: "curated-hype-4",
      title: "Gojo Nah I'd Win",
      url: "https://media.tenor.com/htzPX3xhtSAAAAAM/super-senior-gojo-meme.gif",
      thumbnail: "https://media.tenor.com/htzPX3xhtSAAAAAM/super-senior-gojo-meme.gif",
      source: "Tenor",
    },
  ],
  cinema: [
    {
      id: "curated-cinema-1",
      title: "Absolute Cinema",
      url: "https://media.tenor.com/-GLxXYXKdlAAAAAM/cinema-absolute.gif",
      thumbnail: "https://media.tenor.com/-GLxXYXKdlAAAAAM/cinema-absolute.gif",
      source: "Tenor",
    },
    {
      id: "curated-cinema-2",
      title: "Martin Scorsese Cinema",
      url: "https://media.tenor.com/K07q2u7WnU4AAAAM/cinema-absolute-cinema.gif",
      thumbnail: "https://media.tenor.com/K07q2u7WnU4AAAAM/cinema-absolute-cinema.gif",
      source: "Tenor",
    },
  ],
  cooked: [
    {
      id: "curated-cooked-1",
      title: "Bro is cooked",
      url: "https://media.tenor.com/N9KXo0VYOq0AAAAM/sunnyfication.gif",
      thumbnail: "https://media.tenor.com/N9KXo0VYOq0AAAAM/sunnyfication.gif",
      source: "Tenor",
    },
  ],
  shocked: [
    {
      id: "curated-shocked-1",
      title: "Shocked Face",
      url: "https://media.tenor.com/UyeUDZucVzUAAAAM/shocked-surprised.gif",
      thumbnail: "https://media.tenor.com/UyeUDZucVzUAAAAM/shocked-surprised.gif",
      source: "Tenor",
    },
  ],
};

async function searchTenor(query: string): Promise<GifItem[]> {
  try {
    const cleanQ = query.trim().replace(/\s+/g, "-");
    const url = `https://tenor.com/search/${encodeURIComponent(cleanQ)}-gifs`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) return [];
    const html = await res.text();

    const gifs: GifItem[] = [];
    const seenUrls = new Set<string>();

    const imgRegex = /<img[^>]+src=["'](https:\/\/(?:media\d*|c)\.tenor\.com\/[^"']+\.gif)["'][^>]*alt=["']([^"']*)["']/gi;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = imgRegex.exec(html)) !== null) {
      const rawUrl = match[1];
      const alt = match[2] || query;
      if (!seenUrls.has(rawUrl)) {
        seenUrls.add(rawUrl);
        gifs.push({
          id: `tenor-${idx++}-${Buffer.from(rawUrl).toString("base64").slice(0, 10)}`,
          title: cleanTitle(alt),
          url: rawUrl,
          thumbnail: rawUrl,
          source: "Tenor",
        });
      }
    }

    // Fallback URL regex if img tag structure differs
    if (gifs.length === 0) {
      const fallbackRegex = /"(https:\/\/media\d*\.tenor\.com\/[^"]+\.gif)"/g;
      let fb: RegExpExecArray | null;
      while ((fb = fallbackRegex.exec(html)) !== null) {
        const u = fb[1];
        if (!seenUrls.has(u)) {
          seenUrls.add(u);
          gifs.push({
            id: `tenor-${idx++}-${Buffer.from(u).toString("base64").slice(0, 10)}`,
            title: cleanTitle(query),
            url: u,
            thumbnail: u,
            source: "Tenor",
          });
        }
      }
    }

    return gifs.slice(0, 36);
  } catch (err) {
    console.warn("Tenor GIF search failed:", err);
    return [];
  }
}

async function searchDuckDuckGo(query: string): Promise<GifItem[]> {
  try {
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query + " gif")}&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!tokenRes.ok) return [];
    const html = await tokenRes.text();
    const match = html.match(/vqd=["']?([^&"'\s]+)/);
    const vqd = match ? match[1] : null;
    if (!vqd) return [];

    const imgUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query + " gif")}&vqd=${vqd}&f=type:gif&p=1`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!imgRes.ok) return [];
    const json = (await imgRes.json()) as any;
    const results = json.results || [];

    return results
      .filter((r: any) => r.image && typeof r.image === "string")
      .map((r: any, idx: number) => ({
        id: `ddg-${idx}-${Buffer.from(r.image).toString("base64").slice(0, 10)}`,
        title: cleanTitle(r.title || query),
        url: r.image,
        thumbnail: r.thumbnail || r.image,
        width: r.width,
        height: r.height,
        source: r.source || "Web",
      }))
      .slice(0, 32);
  } catch (err) {
    console.warn("DDG GIF search failed:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const query = rawQuery || "anime hype";
    const cacheKey = query.toLowerCase();

    // 1. Check in-memory cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { gifs: cached.data, cached: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
          },
        }
      );
    }

    // 2. Primary: Tenor Live Web Scraper (Fastest, reliable on cloud/Vercel)
    let gifs = await searchTenor(query);

    // 3. Secondary: DuckDuckGo
    if (gifs.length === 0) {
      gifs = await searchDuckDuckGo(query);
    }

    // 4. Tertiary Fallback: Curated library matching keyword or generic hype
    if (gifs.length === 0) {
      const lower = query.toLowerCase();
      for (const [key, items] of Object.entries(CURATED_MEME_LIBRARY)) {
        if (lower.includes(key)) {
          gifs = items;
          break;
        }
      }
      if (gifs.length === 0) {
        gifs = CURATED_MEME_LIBRARY.hype;
      }
    }

    // Save in cache
    if (gifs.length > 0) {
      if (cache.size > 150) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { timestamp: Date.now(), data: gifs });
    }

    return NextResponse.json(
      { gifs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error: any) {
    console.error("GIF live search error:", error);
    // Even in total catch error, fallback to curated library so the user UI never breaks
    return NextResponse.json({ gifs: CURATED_MEME_LIBRARY.hype }, { status: 200 });
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
