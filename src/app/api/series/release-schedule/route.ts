import { NextRequest, NextResponse } from "next/server";

interface ScheduleResponseData {
  found: boolean;
  sourceName: string;
  sourceSlug?: string;
  sourceLatestChapter?: number;
  sourceUploadedAt?: string;
  sourceStatus?: string;
  cadence: string;
  releaseDay?: string;
  nextExpectedDrop?: string;
  isSourceAhead: boolean;
  aheadBy: number;
}

// In-memory LRU-like cache for release schedule responses (15 min TTL)
const scheduleCache = new Map<string, { timestamp: number; data: ScheduleResponseData }>();
const CACHE_TTL = 15 * 60 * 1000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTitle = searchParams.get("title");
    const currentMaxChapterStr = searchParams.get("currentMaxChapter");
    const currentMaxChapter = currentMaxChapterStr ? parseFloat(currentMaxChapterStr) : 0;

    if (!rawTitle || !rawTitle.trim()) {
      return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    const cleanTitle = rawTitle.trim();
    const cacheKey = cleanTitle.toLowerCase();

    // Check in-memory cache
    const cached = scheduleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Re-evaluate aheadBy in case currentMaxChapter changed
      const resData = { ...cached.data };
      if (resData.sourceLatestChapter && resData.sourceLatestChapter > currentMaxChapter) {
        resData.isSourceAhead = true;
        resData.aheadBy = Math.max(0, Math.round((resData.sourceLatestChapter - currentMaxChapter) * 10) / 10);
      } else {
        resData.isSourceAhead = false;
        resData.aheadBy = 0;
      }
      return NextResponse.json({ success: true, data: resData, cached: true });
    }

    // 1. Try searching Comick API
    const comickEndpoints = [
      `https://api.comick.dev/v1.0/search?q=${encodeURIComponent(cleanTitle)}&limit=5`,
      `https://api.comick.cc/v1.0/search?q=${encodeURIComponent(cleanTitle)}&limit=5`,
    ];

    let comickMatch: any = null;

    for (const endpoint of comickEndpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const items = (await res.json()) as any;
          if (Array.isArray(items) && items.length > 0) {
            // Find closest match or take first
            comickMatch =
              items.find((item: any) => {
                const itemTitle = (item.title || "").toLowerCase();
                const target = cleanTitle.toLowerCase();
                return itemTitle === target || itemTitle.includes(target) || target.includes(itemTitle);
              }) || items[0];
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    if (comickMatch) {
      const sourceLatestChapter = comickMatch.last_chapter ? parseFloat(comickMatch.last_chapter) : undefined;
      const sourceUploadedAt = comickMatch.uploaded_at || undefined;
      let sourceStatus = "ongoing";
      if (comickMatch.status === 2) sourceStatus = "completed";
      else if (comickMatch.status === 3 || comickMatch.status === 4) sourceStatus = "hiatus";

      // Calculate cadence from uploaded_at and weekly intervals
      let cadence = "Weekly";
      let releaseDay: string | undefined;
      let nextExpectedDrop: string | undefined;

      if (sourceUploadedAt && sourceStatus === "ongoing") {
        const lastUploadDate = new Date(sourceUploadedAt);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        releaseDay = dayNames[lastUploadDate.getUTCDay()];
        cadence = `Weekly (${releaseDay}s)`;

        // Estimate next drop: start from lastUploadDate + 7 days
        let nextDrop = new Date(lastUploadDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        // If that date has already passed, advance weekly until it's in the future
        while (nextDrop.getTime() < now.getTime()) {
          nextDrop = new Date(nextDrop.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        nextExpectedDrop = nextDrop.toISOString();
      }

      const isSourceAhead = sourceLatestChapter != null && sourceLatestChapter > currentMaxChapter;
      const aheadBy = isSourceAhead && sourceLatestChapter ? Math.max(0, sourceLatestChapter - currentMaxChapter) : 0;

      const scheduleData: ScheduleResponseData = {
        found: true,
        sourceName: "Comick.dev",
        sourceSlug: comickMatch.slug,
        sourceLatestChapter,
        sourceUploadedAt,
        sourceStatus,
        cadence,
        releaseDay,
        nextExpectedDrop,
        isSourceAhead,
        aheadBy,
      };

      scheduleCache.set(cacheKey, { timestamp: Date.now(), data: scheduleData });
      return NextResponse.json({ success: true, data: scheduleData });
    }

    // 2. Fallback: Query MangaDex
    try {
      const mdRes = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=3`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(4000),
        }
      );

      if (mdRes.ok) {
        const mdJson = (await mdRes.json()) as any;
        if (Array.isArray(mdJson?.data) && mdJson.data.length > 0) {
          const manga = mdJson.data[0];
          const lastChapter = manga.attributes?.latestUploadedChapter
            ? parseFloat(manga.attributes.latestUploadedChapter)
            : undefined;
          const updatedAt = manga.attributes?.updatedAt || undefined;
          const status = manga.attributes?.status || "ongoing";

          let cadence = "Weekly";
          let releaseDay: string | undefined;
          let nextExpectedDrop: string | undefined;

          if (updatedAt && status === "ongoing") {
            const lastDate = new Date(updatedAt);
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            releaseDay = dayNames[lastDate.getUTCDay()];
            cadence = `Weekly (${releaseDay}s)`;

            let nextDrop = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const now = new Date();
            while (nextDrop.getTime() < now.getTime()) {
              nextDrop = new Date(nextDrop.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            nextExpectedDrop = nextDrop.toISOString();
          }

          const isSourceAhead = lastChapter != null && lastChapter > currentMaxChapter;
          const aheadBy = isSourceAhead && lastChapter ? Math.max(0, lastChapter - currentMaxChapter) : 0;

          const scheduleData: ScheduleResponseData = {
            found: true,
            sourceName: "MangaDex",
            sourceLatestChapter: lastChapter,
            sourceUploadedAt: updatedAt,
            sourceStatus: status,
            cadence,
            releaseDay,
            nextExpectedDrop,
            isSourceAhead,
            aheadBy,
          };

          scheduleCache.set(cacheKey, { timestamp: Date.now(), data: scheduleData });
          return NextResponse.json({ success: true, data: scheduleData });
        }
      }
    } catch {
      // Ignore fallback error
    }

    return NextResponse.json({
      success: true,
      data: {
        found: false,
        sourceName: "Local Estimate",
        cadence: "Weekly",
        isSourceAhead: false,
        aheadBy: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch release schedule" },
      { status: 500 }
    );
  }
}
