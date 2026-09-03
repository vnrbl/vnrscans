/**
 * Scan timing and release schedule estimation module for series and import sources.
 * Detects scanlation group update timings and calculates the Estimated Next Release time.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface ScanTimingResult {
  cadence: string;
  releaseDay?: string;
  estimatedNextRelease: string;
  sourceLatestChapter?: number;
  sourceName?: string;
  sourceUploadedAt?: string;
  isSourceAhead: boolean;
  aheadBy: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Scan source update timing for a series using Comick, MangaDex, or local chapter cadence history.
 */
export async function detectSourceScanTiming(params: {
  seriesTitle?: string | null;
  sourceUrl?: string | null;
  currentMaxChapter?: number;
  localChapters?: Array<{ chapter_number: number; created_at: string }>;
}): Promise<ScanTimingResult> {
  const { seriesTitle, currentMaxChapter = 0, localChapters = [] } = params;
  const cleanTitle = (seriesTitle || "").trim();
  const now = new Date();

  // 1. Try querying Comick API if title is available
  if (cleanTitle) {
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
      // Continue to next endpoint or fallback
    }
  }

  if (comickMatch) {
    const sourceLatestChapter = comickMatch.last_chapter ? parseFloat(comickMatch.last_chapter) : undefined;
    const sourceUploadedAt = comickMatch.uploaded_at || undefined;
    let sourceStatus = "ongoing";
    if (comickMatch.status === 2) sourceStatus = "completed";
    else if (comickMatch.status === 3 || comickMatch.status === 4) sourceStatus = "hiatus";

    let cadence = "Weekly";
    let releaseDay: string | undefined;
    let nextDrop = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (sourceUploadedAt && sourceStatus === "ongoing") {
      const lastUploadDate = new Date(sourceUploadedAt);
      releaseDay = DAY_NAMES[lastUploadDate.getUTCDay()];
      cadence = `Weekly (${releaseDay}s)`;

      // Advance from last upload by 7 days until in future
      nextDrop = new Date(lastUploadDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      while (nextDrop.getTime() <= now.getTime()) {
        nextDrop = new Date(nextDrop.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // If the expected chapter is already imported locally (currentMaxChapter >= sourceLatestChapter),
      // reset and advance countdown to the upcoming next chapter release!
      if (sourceLatestChapter != null && currentMaxChapter >= sourceLatestChapter) {
        // If nextDrop is within 6 hours or in past, advance to next weekly cycle
        if (nextDrop.getTime() - now.getTime() < 6 * 60 * 60 * 1000) {
          nextDrop = new Date(nextDrop.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      }
    }

    const isSourceAhead = sourceLatestChapter != null && sourceLatestChapter > currentMaxChapter;
    const aheadBy = isSourceAhead && sourceLatestChapter ? Math.max(0, sourceLatestChapter - currentMaxChapter) : 0;

    return {
      cadence,
      releaseDay,
      estimatedNextRelease: nextDrop.toISOString(),
      sourceLatestChapter,
      sourceName: "Comick",
      sourceUploadedAt,
      isSourceAhead,
      aheadBy,
    };
  }

  // 2. Try querying MangaDex API
  try {
    const mdRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=3`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(3500),
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
        let nextDrop = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (updatedAt && status === "ongoing") {
          const lastDate = new Date(updatedAt);
          releaseDay = DAY_NAMES[lastDate.getUTCDay()];
          cadence = `Weekly (${releaseDay}s)`;

          nextDrop = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          while (nextDrop.getTime() <= now.getTime()) {
            nextDrop = new Date(nextDrop.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
        }

        const isSourceAhead = lastChapter != null && lastChapter > currentMaxChapter;
        const aheadBy = isSourceAhead && lastChapter ? Math.max(0, lastChapter - currentMaxChapter) : 0;

        return {
          cadence,
          releaseDay,
          estimatedNextRelease: nextDrop.toISOString(),
          sourceLatestChapter: lastChapter,
          sourceName: "MangaDex",
          sourceUploadedAt: updatedAt,
          isSourceAhead,
          aheadBy,
        };
      }
    }
    } catch {
      // Continue to local cadence fallback
    }
  }

  // 3. Fallback: Calculate from local chapter intervals
  if (localChapters.length >= 2) {
    const sorted = [...localChapters]
      .filter((c) => c.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    if (sorted.length >= 2) {
      const dates = sorted.map((c) => new Date(c.created_at).getTime());
      const diffs: number[] = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const diffDays = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) diffs.push(diffDays);
      }

      if (diffs.length > 0) {
        const avgDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const lastRelease = new Date(dates[0]);
        const releaseDay = DAY_NAMES[lastRelease.getUTCDay()];

        let cadence = "Weekly";
        let stepDays = 7;

        if (avgDays < 2.5) {
          cadence = "Daily";
          stepDays = 1;
        } else if (avgDays <= 9) {
          cadence = `Weekly (${releaseDay}s)`;
          stepDays = 7;
        } else if (avgDays <= 18) {
          cadence = "Bi-weekly";
          stepDays = 14;
        } else {
          cadence = "Monthly";
          stepDays = 30;
        }

        let nextDrop = new Date(lastRelease.getTime() + stepDays * 24 * 60 * 60 * 1000);
        while (nextDrop.getTime() <= now.getTime()) {
          nextDrop = new Date(nextDrop.getTime() + stepDays * 24 * 60 * 60 * 1000);
        }

        return {
          cadence,
          releaseDay,
          estimatedNextRelease: nextDrop.toISOString(),
          sourceName: "Local History",
          isSourceAhead: false,
          aheadBy: 0,
        };
      }
    }
  }

  // Default fallback: 7 days from now
  const defaultNext = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultDay = DAY_NAMES[defaultNext.getUTCDay()];
  return {
    cadence: `Weekly (${defaultDay}s)`,
    releaseDay: defaultDay,
    estimatedNextRelease: defaultNext.toISOString(),
    sourceName: "Estimated",
    isSourceAhead: false,
    aheadBy: 0,
  };
}

/**
 * Calculates the next release time after a successful drop or import.
 * For example, if cadence is Weekly (Wednesdays), advances 7 days into the future.
 */
export function advanceNextReleaseAfterDrop(currentEstimated: string | null, cadenceText?: string | null): string {
  const now = new Date();
  let base = currentEstimated ? new Date(currentEstimated) : now;
  if (isNaN(base.getTime())) {
    base = now;
  }
  let stepDays = 7;

  if (cadenceText) {
    const lower = cadenceText.toLowerCase();
    if (lower.includes("daily")) stepDays = 1;
    else if (lower.includes("bi-weekly")) stepDays = 14;
    else if (lower.includes("monthly")) stepDays = 30;
  }

  let next = new Date(base.getTime() + stepDays * 24 * 60 * 60 * 1000);
  while (next.getTime() <= now.getTime()) {
    next = new Date(next.getTime() + stepDays * 24 * 60 * 60 * 1000);
  }

  return next.toISOString();
}

/**
 * Checks if an import source is due for scheduled scraping.
 * A source is due if:
 * 1. It has never been checked.
 * 2. estimated_next_release_at is in the past (or within 5 minutes).
 * 3. Or it has not been checked in over 24 hours (safety fallback).
 */
export function isSourceDueForScraping(source: {
  last_checked_at?: string | null;
  estimated_next_release_at?: string | null;
  check_interval_minutes?: number | null;
}): boolean {
  if (!source.last_checked_at) return true;

  const now = Date.now();
  const fiveMinutesInAdvance = now + 5 * 60 * 1000;

  if (source.estimated_next_release_at) {
    const estimatedTime = new Date(source.estimated_next_release_at).getTime();
    if (estimatedTime <= fiveMinutesInAdvance) {
      return true;
    }
  }

  // Fallback: check if last_checked_at is older than check_interval_minutes (or 24h)
  const lastChecked = new Date(source.last_checked_at).getTime();
  const intervalMs = Math.max(60, Number(source.check_interval_minutes || 120)) * 60 * 1000;
  return now - lastChecked >= intervalMs;
}
