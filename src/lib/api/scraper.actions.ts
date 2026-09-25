"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  extractChaptersFromSeriesUrl,
  extractImagesFromChapterUrl,
  extractImagesFromChapterUrls,
  isPremiumOrLockedChapter,
  isElftoonUrl,
} from "../chapter-scraper";
import { buildChapterSlug } from "../chapter-utils";
import { detectImportSource, normalizeScanlationGroup } from "../import-source-utils";
import {
  detectSourceScanTiming,
  advanceNextReleaseAfterDrop,
  isSourceDueForScraping,
} from "../release-timing";

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(requestUserToken: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) throw new Error("Missing Supabase env vars");

  const userClient = createClient(url, anonKey);
  const { data: { user }, error } = await userClient.auth.getUser(requestUserToken);
  if (error || !user) throw new Error("Unauthorized: invalid token");

  const admin = getAdminSupabase();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin role required");

  // Fetch username from profiles table
  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  (user as any).username = profile?.username || "vnr610";

  return user as typeof user & { username: string };
}

function matchesInternalActionSecret(supplied: string, expected: string) {
  if (supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function isInternalActionToken(token: string) {
  const configuredSecrets = [process.env.CRON_SECRET, process.env.TELEGRAM_ACTION_SECRET]
    .filter((secret): secret is string => typeof secret === "string" && secret.length >= 32);
  return configuredSecrets.some((secret) => matchesInternalActionSecret(token, secret));
}

export async function $extractChaptersFromUrl(args: {
  data: {
    url: string;
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({ url: z.string().url(), accessToken: z.string().min(1) })
      .parse(data);
    await verifyAdmin(validated.accessToken);
    const chapters = await extractChaptersFromSeriesUrl(validated.url);
    return { success: true, chapters };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract chapters"
    };
  }
}

export async function $extractImagesFromUrl(args: {
  data: {
    url: string;
    imageUrlExample?: string;
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        url: z.string().url(),
        imageUrlExample: z.string().url().optional().or(z.literal("")),
        accessToken: z.string().min(1),
      })
      .parse(data);
    await verifyAdmin(validated.accessToken);
    const images = await extractImagesFromChapterUrl(validated.url, {
      imageUrlExample: validated.imageUrlExample || null,
    });
    return { success: true, images };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to extract images" 
    };
  }
}

export async function $extractCoversFromScanUrl(args: {
  data: {
    url: string;
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        url: z.string().url(),
        accessToken: z.string().min(1),
      })
      .parse(data);

    await verifyAdmin(validated.accessToken);

    const targetUrl = validated.url.trim();
    const candidateCovers: string[] = [];

    // 1. QiScans / QiManga special handling
    if (targetUrl.toLowerCase().includes("qimanga") || targetUrl.toLowerCase().includes("qiscans") || targetUrl.toLowerCase().includes("qimanhwa")) {
      try {
        const urlObj = new URL(targetUrl);
        const parts = urlObj.pathname.split("/").filter(Boolean);
        const slug = parts[parts.length - 1];
        if (slug) {
          const apiRes = await fetch(`https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Accept": "application/json",
            },
          });
          if (apiRes.ok) {
            const apiData = (await apiRes.json()) as any;
            if (apiData?.data?.cover) candidateCovers.push(apiData.data.cover);
            if (apiData?.data?.thumbnail) candidateCovers.push(apiData.data.thumbnail);
            if (apiData?.data?.banner) candidateCovers.push(apiData.data.banner);
          }
        }
      } catch (err) {
        console.warn("[CoverExtractor] QiManga API cover fetch failed:", err);
      }
    }

    // 2. Fetch HTML to extract OpenGraph, Twitter, meta, and hero image
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (res.ok) {
        const html = await res.text();

        // Match og:image
        const ogMatches = html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi);
        for (const match of ogMatches) {
          if (match[1]) candidateCovers.push(match[1]);
        }
        const ogContentMatches = html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi);
        for (const match of ogContentMatches) {
          if (match[1]) candidateCovers.push(match[1]);
        }

        // Match twitter:image
        const twMatches = html.matchAll(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi);
        for (const match of twMatches) {
          if (match[1]) candidateCovers.push(match[1]);
        }

        // Match common cover / thumbnail classes
        const imgMatches = html.matchAll(/<img[^>]+(?:class=["'][^"']*(?:thumb|cover|poster|series-img|featured)[^"']*["'])[^>]+src=["']([^"']+)["']/gi);
        for (const match of imgMatches) {
          if (match[1] && !match[1].endsWith(".svg") && !match[1].includes("logo")) {
            candidateCovers.push(match[1]);
          }
        }

        // Match Next.js /uploads/series cover images for Kayn Scans
        if (isKaynScansUrl(targetUrl)) {
          const coverMatch = html.match(/\/uploads\/series\/[^\/&"']+\/cover\.(?:jpe?g|png|webp|avif)/i) ||
            html.match(/url=(?:%2F|\/)uploads(?:%2F|\/)series(?:%2F|\/)[^&"']+/i);
          if (coverMatch) {
            const rawCover = decodeURIComponent(coverMatch[0].replace(/^url=/, ''));
            const fullCover = rawCover.startsWith('http') ? rawCover : `https://kaynscans.com${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
            candidateCovers.unshift(fullCover);
          }
        }

        // Match Next.js /uploads/series cover images for Drake Comic
        if (isDrakeComicUrl(targetUrl)) {
          const coverMatch = html.match(/\/uploads\/series\/[^\/&"']+\/cover\.(?:jpe?g|png|webp|avif)/i) ||
            html.match(/url=(?:%2F|\/)uploads(?:%2F|\/)series(?:%2F|\/)[^&"']+/i);
          if (coverMatch) {
            const rawCover = decodeURIComponent(coverMatch[0].replace(/^url=/, ''));
            const fullCover = rawCover.startsWith('http') ? rawCover : `https://drakecomic.net${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
            candidateCovers.unshift(fullCover);
          }
        }

        // Match Next.js /uploads/series cover images for WitchToons
        if (isWitchToonsUrl(targetUrl)) {
          const coverMatch = html.match(/\/uploads\/series\/[^\/&"']+\/cover\.(?:jpe?g|png|webp|avif)/i) ||
            html.match(/url=(?:%2F|\/)uploads(?:%2F|\/)series(?:%2F|\/)[^&"']+/i);
          if (coverMatch) {
            const rawCover = decodeURIComponent(coverMatch[0].replace(/^url=/, ''));
            const fullCover = rawCover.startsWith('http') ? rawCover : `https://witchtoons.net${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
            candidateCovers.unshift(fullCover);
          }
        }

        // Match DuskScans cover images
        if (isDuskScansUrl(targetUrl)) {
          const coverMatch = html.match(/https:\/\/cdn\.duskscans\.com\/storage\/uploads\/covers\/[^\s"']+\.(?:webp|jpe?g|png|avif)/i);
          if (coverMatch) {
            candidateCovers.unshift(coverMatch[0]);
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[CoverExtractor] HTML cover fetch error:", fetchErr);
    }

    // Clean & normalize URLs
    const cleanCovers = Array.from(new Set(
      candidateCovers
        .map((c) => c.trim())
        .filter((c) => c.startsWith("http://") || c.startsWith("https://"))
        .filter((c) => !c.includes("favicon") && !c.includes("logo") && !c.endsWith(".svg"))
    ));

    return {
      success: true,
      covers: cleanCovers,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract cover from URL",
      covers: [],
    };
  }
}

export async function $autoImportSeriesCover(args: {
  data: {
    seriesId: string;
    accessToken: string;
    customUrl?: string;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        seriesId: z.string().uuid(),
        accessToken: z.string().min(1),
        customUrl: z.string().url().optional().or(z.literal("")),
      })
      .parse(data);

    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    let targetScanUrl = validated.customUrl?.trim() || "";

    // If no custom URL provided, look up from series_import_sources
    if (!targetScanUrl) {
      const { data: sources, error: srcErr } = await admin
        .from("series_import_sources")
        .select("source_url")
        .eq("series_id", validated.seriesId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (srcErr) throw srcErr;
      if (sources && sources.length > 0 && sources[0].source_url) {
        targetScanUrl = sources[0].source_url;
      }
    }

    if (!targetScanUrl) {
      const { data: seriesRow } = await admin
        .from("series")
        .select("title, slug")
        .eq("id", validated.seriesId)
        .single();

      return {
        success: false,
        noSource: true,
        error: `No scan source URL is linked to "${seriesRow?.title || "this series"}". Please paste a scan URL once in the input box to link and import cover.`,
      };
    }

    // Extract covers from targetScanUrl
    const extractRes = await $extractCoversFromScanUrl({
      data: {
        url: targetScanUrl,
        accessToken: validated.accessToken,
      },
    });

    if (!extractRes.success || !extractRes.covers || extractRes.covers.length === 0) {
      return {
        success: false,
        error: `Failed to find cover image from scan source: ${targetScanUrl}`,
      };
    }

    const bestCover = extractRes.covers[0];

    const { data: currentSeries } = await admin
      .from("series")
      .select("cover_url")
      .eq("id", validated.seriesId)
      .single();

    const oldCoverUrl = currentSeries?.cover_url;

    // 1. Preserve existing old cover in series_covers so it is never lost from cover selection
    if (oldCoverUrl && oldCoverUrl !== bestCover) {
      const { data: oldCoverExists } = await admin
        .from("series_covers")
        .select("id")
        .eq("series_id", validated.seriesId)
        .eq("image_url", oldCoverUrl)
        .maybeSingle();

      if (!oldCoverExists) {
        await admin.from("series_covers").insert({
          series_id: validated.seriesId,
          image_url: oldCoverUrl,
          position: 1,
        });
      }
    }

    // 2. Update series cover_url to use recent cover by default
    const { error: updateErr } = await admin
      .from("series")
      .update({ cover_url: bestCover, updated_at: new Date().toISOString() })
      .eq("id", validated.seriesId);

    if (updateErr) throw updateErr;

    // 3. Add to series_covers table if not exists
    const { data: existingCover } = await admin
      .from("series_covers")
      .select("id")
      .eq("series_id", validated.seriesId)
      .eq("image_url", bestCover)
      .maybeSingle();

    if (!existingCover) {
      await admin.from("series_covers").insert({
        series_id: validated.seriesId,
        image_url: bestCover,
        position: 0,
      });
    }

    return {
      success: true,
      coverUrl: bestCover,
      totalDiscovered: extractRes.covers.length,
      allCovers: extractRes.covers,
      sourceUrl: targetScanUrl,
      message: `Cover picture imported successfully from scan source!`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to auto-import cover",
    };
  }
}

/** Trusted CDN sources that don't need mirroring — their URLs are stable and fast */
function isTrustedCdnSource(sourceUrl: string): boolean {
  const lower = sourceUrl.toLowerCase();
  return (
    lower.includes('cdn.duskscans.com') ||
    lower.includes('cdn.asurascans.com') ||
    lower.includes('asura-images') ||
    lower.includes('storage.hivetoon.com') ||
    lower.includes('media.qimanga.com') ||
    lower.includes('kaynscans.com/uploads') ||
    lower.includes('drakecomic.net/uploads') ||
    lower.includes('witchtoons.net/uploads')
  );
}

/** Check if all images in the batch come from a trusted CDN that doesn't need mirroring */
function shouldSkipMirroring(images: string[]): boolean {
  if (images.length === 0) return false;
  return images.every((url) => isTrustedCdnSource(url) || url.includes('supabase.co/storage') || url.includes('/assets/'));
}

/** Check if an image is already hosted on our infrastructure (Supabase Storage or R2) */
function isAlreadyMirrored(url: string): boolean {
  return url.includes('supabase.co/storage') || url.includes('/assets/');
}

/** Get the Cloudflare Worker URL for R2 uploads */
function getWorkerUrl(): string | null {
  const url = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;
  return url ? url.replace(/\/$/, '') : null;
}

/** Upload a single image to Cloudflare R2 via the Worker */
async function uploadToR2(
  workerUrl: string,
  storagePath: string,
  imageBuffer: ArrayBuffer,
  contentType: string
): Promise<string | null> {
  try {
    const uploadSecret = process.env.WORKER_UPLOAD_SECRET;
    const base64Data = Buffer.from(imageBuffer).toString('base64');

    const res = await fetch(`${workerUrl}/assets/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(uploadSecret ? { 'x-worker-secret': uploadSecret } : {}),
      },
      body: JSON.stringify({
        key: `chapter-pages/${storagePath}`,
        data: base64Data,
        contentType,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      // Return the full public URL for the R2 asset
      return `${workerUrl}/assets/chapter-pages/${storagePath}`;
    }

    const errBody = await res.text().catch(() => '');
    console.warn(`[R2Mirror] Upload failed (${res.status}): ${errBody}`);
    return null;
  } catch (e) {
    console.warn(`[R2Mirror] Upload error for ${storagePath}:`, e);
    return null;
  }
}

async function mirrorPagesForChapter(
  _admin: ReturnType<typeof getAdminSupabase>,
  seriesSlug: string,
  chapterSlug: string,
  images: string[],
  forceRefresh = false,
): Promise<string[]> {
  // Skip mirroring entirely for trusted CDN sources
  if (!forceRefresh && shouldSkipMirroring(images)) {
    console.log(`[StorageMirror] Skipping mirror for ${chapterSlug} — ${images.length} images from trusted CDN`);
    return images;
  }

  const workerUrl = getWorkerUrl();
  if (!workerUrl) {
    console.warn(`[StorageMirror] No WORKER_URL set — skipping R2 mirror, using raw URLs`);
    return images;
  }

  // Process images in batches of 8 to avoid overwhelming memory/connections
  const BATCH_SIZE = 8;
  const result: string[] = new Array(images.length);

  for (let batchStart = 0; batchStart < images.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, images.length);
    const batchPromises = [];

    for (let idx = batchStart; idx < batchEnd; idx++) {
      const rawImgUrl = images[idx];
      const pageNum = idx + 1;

      batchPromises.push(
        (async () => {
          // Skip if already on our infrastructure
          if (!forceRefresh && isAlreadyMirrored(rawImgUrl)) {
            return { idx, url: rawImgUrl };
          }
          try {
            const isVortex = rawImgUrl.includes("vortexscans.org");
            const isComix = rawImgUrl.includes("wowpic") || rawImgUrl.includes("comix.to");
            const referer = isVortex ? "https://vortexscans.org/" : isComix ? "https://comix.to/" : undefined;

            const res = await fetch(rawImgUrl, {
              headers: {
                ...(referer ? { Referer: referer } : {}),
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
              },
              signal: AbortSignal.timeout(10_000),
            });

            if (res.ok) {
              const contentType = res.headers.get("content-type") || "image/webp";
              const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";
              const arrayBuffer = await res.arrayBuffer();
              const storagePath = `${seriesSlug}/${chapterSlug}/page-${String(pageNum).padStart(3, "0")}.${ext}`;

              const r2Url = await uploadToR2(workerUrl, storagePath, arrayBuffer, contentType);
              if (r2Url) {
                return { idx, url: r2Url };
              }
            }
          } catch (e) {
            console.warn(`[StorageMirror] Failed for ${chapterSlug} p${pageNum}:`, e);
          }
          // Fall back to raw CDN URL on mirror failure
          return { idx, url: rawImgUrl };
        })()
      );
    }

    const batchResults = await Promise.all(batchPromises);
    for (const { idx, url } of batchResults) {
      result[idx] = url;
    }
  }

  return result;
}

export async function $runCloudScrape(args: {
  data: {
    accessToken: string;
    seriesId: string | null;
    url: string;
    imageUrlExample?: string;
    scanlationGroup?: string | null;
    uploader?: string | null;
  };
}) {
  try {
  const { data } = args;
  const validated = z
    .object({
      accessToken: z.string().min(1),
      seriesId: z.string().uuid().nullable(),
      url: z.string().url(),
      imageUrlExample: z.string().url().optional().or(z.literal("")),
      scanlationGroup: z.string().optional().nullable(),
      uploader: z.string().optional().nullable(),
    })
    .parse(data);

  const adminUser = await verifyAdmin(validated.accessToken);

  const admin = getAdminSupabase();
  const imageUrlExample = validated.imageUrlExample || null;
  const scanlationGroup = validated.scanlationGroup?.trim() || inferSourceGroup(validated.url);
  const uploadedBy = validated.uploader?.trim() || (adminUser as any)?.username || "vnr610";

  const allDiscovered = await extractChaptersFromSeriesUrl(validated.url);

  // Filter out premium/locked/paid chapters
  const discovered = allDiscovered.filter((ch) => !isPremiumChapter(ch));
  const premiumSkippedCount = allDiscovered.length - discovered.length;
  if (premiumSkippedCount > 0) {
    console.log(`[CloudScrape] Skipped ${premiumSkippedCount} premium/locked chapter(s)`);
  }

  if (!validated.seriesId) {
    return {
      success: true,
      dryRun: true,
      chaptersFound: discovered.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      premiumSkipped: premiumSkippedCount,
      details: discovered.map((chapter) => ({
        chapter: chapter.chapterNumber,
        status: "found",
        url: chapter.url,
      })),
    };
  }

  const { data: existingRows, error: existingError } = await admin
    .from("chapters")
    .select("id,chapter_number,scanlation_group,chapter_type")
    .eq("series_id", validated.seriesId);

  if (existingError) {
    return {
      success: false,
      error: `Failed to query existing chapters: ${existingError.message}`,
      chaptersFound: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      premiumSkipped: premiumSkippedCount,
      details: [],
    };
  }

  const activeRows = existingRows ?? [];

  const existingChapterNumbers = new Set(
    activeRows.map((chapter: any) => Number(chapter.chapter_number)),
  );
  const existingKeys = new Set(
    activeRows.map((chapter: any) =>
      chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
    ),
  );

  let exactDuplicateCount = 0;
  const seenNumbers = new Set<number>();
  const missing = discovered.filter((chapter) => {
    const num = Number(chapter.chapterNumber);
    // Skip if chapter with this number already exists in our database for this series
    if (isNaN(num) || existingChapterNumbers.has(num) || seenNumbers.has(num)) {
      exactDuplicateCount++;
      return false;
    }
    seenNumbers.add(num);
    return true;
  });

  const details: Array<{ chapter: number; status: string; message?: string; pages?: number }> = [];

  if (missing.length === 0) {
    return {
      success: true,
      dryRun: false,
      chaptersFound: discovered.length,
      imported: 0,
      skipped: exactDuplicateCount,
      failed: 0,
      details,
    };
  }

  const isAsura = validated.url.toLowerCase().includes('asura');
  const isDusk = validated.url.toLowerCase().includes('duskscans');
  const extractedImages = await extractImagesFromChapterUrls(
    missing.map((chapter) => chapter.url),
    { concurrency: isAsura ? 6 : isDusk ? 15 : 10, imageUrlExample },
  );

  const chapterRows: Array<{
    series_id: string;
    chapter_number: number;
    title: string | null;
    slug: string;
    chapter_type: "image";
    status: "published";
    uploaded_by: string | null;
    scanlation_group: string | null;
  }> = [];
  const chapterImages = new Map<string, string[]>();
  let failed = 0;

  for (const chapter of missing) {
    try {
      const rawImages =
        extractedImages.get(chapter.url) ??
        (await extractImagesFromChapterUrl(chapter.url, { imageUrlExample }));
      const images = filterImagesByExampleUrl(rawImages, imageUrlExample || "");

      if (images.length === 0) {
        throw new Error(
          imageUrlExample
            ? "No images matching the example URL type were found."
            : "No images found on chapter page.",
        );
      }

      const slug = buildChapterSlug(chapter.chapterNumber, {
        title: chapter.title || null,
        scanlationGroup,
      });

      chapterRows.push({
        series_id: validated.seriesId,
        chapter_number: chapter.chapterNumber,
        title: chapter.title || null,
        slug,
        chapter_type: "image",
        status: "published",
        uploaded_by: uploadedBy,
        scanlation_group: scanlationGroup || null,
      });
      chapterImages.set(chapterScanKey(chapter.chapterNumber, scanlationGroup), images);
    } catch (error) {
      failed++;
      details.push({
        chapter: chapter.chapterNumber,
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  let imported = 0;

  if (chapterRows.length > 0) {
    let insertedChapters: any[] = [];
    const { data: bulkInserted, error: chapterInsertError } = await admin
      .from("chapters")
      .insert(chapterRows)
      .select("id,chapter_number,scanlation_group");

    if (chapterInsertError) {
      console.warn("[CloudScrape] Bulk insert failed, retrying row-by-row:", chapterInsertError.message);
      for (const row of chapterRows) {
        let finalRow = { ...row };
        let { data: singleCh, error: singleErr } = await admin
          .from("chapters")
          .insert(finalRow)
          .select("id,chapter_number,scanlation_group")
          .single();

        if (singleErr && (singleErr.message?.includes("slug") || singleErr.code === "23505")) {
          finalRow.slug = `${finalRow.slug}-${Math.random().toString(36).substring(2, 7)}`;
          const retryRes = await admin
            .from("chapters")
            .insert(finalRow)
            .select("id,chapter_number,scanlation_group")
            .single();
          singleCh = retryRes.data;
          singleErr = retryRes.error;
        }

        if (singleErr || !singleCh) {
          failed++;
          details.push({
            chapter: Number(row.chapter_number),
            status: "failed",
            message: singleErr?.message || "Failed to insert chapter",
          });
        } else {
          insertedChapters.push(singleCh);
        }
      }
    } else {
      insertedChapters = bulkInserted ?? [];
    }

    if (insertedChapters.length === 0 && chapterRows.length > 0) {
      return {
        success: false,
        error: chapterInsertError?.message || "All chapter inserts failed",
        chaptersFound: discovered.length,
        imported: 0,
        skipped: exactDuplicateCount,
        failed: failed + chapterRows.length,
        details,
      };
    }

    let seriesSlug = "series";
    if (validated.seriesId) {
      const { data: s } = await admin.from("series").select("slug").eq("id", validated.seriesId).maybeSingle();
      if (s?.slug) seriesSlug = s.slug;
    }

    const pageRows: Array<{ chapter_id: string; page_number: number; image_url: string }> = [];

    // Check if all images across all chapters are from trusted CDNs (skip mirroring entirely)
    const allImagesAreTrusted = (insertedChapters ?? []).every((chapter: any) => {
      const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
      const imgs = chapterImages.get(key) ?? [];
      return shouldSkipMirroring(imgs);
    });

    if (allImagesAreTrusted) {
      // Fast path: skip mirroring entirely, use CDN URLs directly
      console.log(`[CloudScrape] All images from trusted CDNs — skipping mirror for ${insertedChapters?.length ?? 0} chapter(s)`);
      for (const chapter of insertedChapters ?? []) {
        const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
        const rawImages = chapterImages.get(key) ?? [];
        rawImages.forEach((url, index) => {
          pageRows.push({
            chapter_id: chapter.id,
            page_number: index + 1,
            image_url: url,
          });
        });
      }
    } else {
      // Mirror path: process up to 3 chapters in parallel
      const CHAPTER_CONCURRENCY = 3;
      const chaptersToMirror = [...(insertedChapters ?? [])];
      for (let ci = 0; ci < chaptersToMirror.length; ci += CHAPTER_CONCURRENCY) {
        const chapterBatch = chaptersToMirror.slice(ci, ci + CHAPTER_CONCURRENCY);
        const batchResults = await Promise.all(
          chapterBatch.map(async (chapter: any) => {
            const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
            const rawImages = chapterImages.get(key) ?? [];
            const chSlug = chapter.slug || `chapter-${chapter.chapter_number}`;
            const mirroredUrls = await mirrorPagesForChapter(admin, seriesSlug, chSlug, rawImages);
            return { chapter, mirroredUrls };
          })
        );
        for (const { chapter, mirroredUrls } of batchResults) {
          mirroredUrls.forEach((url, index) => {
            pageRows.push({
              chapter_id: chapter.id,
              page_number: index + 1,
              image_url: url,
            });
          });
        }
      }
    }

    const { error: pagesError } = await admin.from("chapter_pages").insert(pageRows);

    if (pagesError) {
      return {
        success: false,
        error: pagesError.message,
        chaptersFound: discovered.length,
        imported: 0,
        skipped: exactDuplicateCount,
        failed: failed + chapterRows.length,
        details,
      };
    }

    imported = insertedChapters?.length ?? 0;
    for (const chapter of insertedChapters ?? []) {
      const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
      details.push({
        chapter: Number(chapter.chapter_number),
        status: "imported",
        pages: chapterImages.get(key)?.length ?? 0,
      });
    }
  }

  return {
    success: true,
    dryRun: false,
    chaptersFound: discovered.length,
    imported,
    skipped: exactDuplicateCount,
    failed,
    details,
  };
  } catch (error) {
    console.error("[CloudScrape] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Cloud scrape failed";
    return {
      success: false,
      error: message,
      chaptersFound: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };
  }
}

export async function $syncImportSource(args: {
  data: {
    sourceId: string;
    accessToken: string;
    maxChapters?: number;
    mode?: "latest" | "all";
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        sourceId: z.string().uuid(),
        accessToken: z.string().min(1),
        maxChapters: z.number().int().min(1).max(1000).optional(),
        mode: z.enum(["latest", "all"]).optional(),
      })
    .parse(data);

  let uploaderUsername = "vnr610";
  if (!isInternalActionToken(validated.accessToken)) {
    const adminUser = await verifyAdmin(validated.accessToken);
    uploaderUsername = (adminUser as any)?.username || "vnr610";
  }

  const admin = getAdminSupabase();
  const startedAt = new Date().toISOString();

  const { data: source, error: sourceError } = await admin
    .from("series_import_sources")
    .select("*, series:series(id, title, slug, cover_url)")
    .eq("id", validated.sourceId)
    .single();

  if (sourceError || !source) {
    return { success: false, error: sourceError?.message || "Import source not found" };
  }

  const seriesTitle = (source as any)?.series?.title || "";
  const sourcePreset = detectImportSource(source.source_url);
  const scanlationGroup = source.scanlation_group || sourcePreset.scanlationGroup || null;
  const imageUrlExample = source.image_url_example || sourcePreset.imageUrlExample || null;
  let chaptersFound = 0;
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const details: Array<{ chapter: number; status: string; message?: string; pages?: number; series_title?: string }> = [];

  let premiumSkipped = 0;

  try {
    const allDiscovered = await extractChaptersFromSeriesUrl(source.source_url);

    // Filter out premium/locked/paid chapters
    const discovered = allDiscovered.filter((ch) => !isPremiumChapter(ch));
    premiumSkipped = allDiscovered.length - discovered.length;
    if (premiumSkipped > 0) {
      console.log(`[SyncImport] Skipped ${premiumSkipped} premium/locked chapter(s)`);
      details.push(...allDiscovered
        .filter((ch) => isPremiumChapter(ch))
        .map((ch) => ({
          chapter: ch.chapterNumber,
          status: "premium_skipped" as const,
          message: "Premium/locked chapter",
          series_title: seriesTitle || undefined,
        })));
    }
    chaptersFound = discovered.length;

    const { data: existingRows, error: existingError } = await admin
      .from("chapters")
      .select("id,chapter_number,scanlation_group,chapter_type,created_at")
      .eq("series_id", source.series_id);

    if (existingError) throw existingError;

    const activeRows = existingRows ?? [];

    const existingChapterNumbers = new Set(
      activeRows.map((chapter: any) => Number(chapter.chapter_number)),
    );
    const existingKeys = new Set(
      activeRows.map((chapter: any) =>
        chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
      ),
    );

    const seenNumbers = new Set<number>();
    const missingCandidates = discovered
      .filter((chapter) => {
        const num = Number(chapter.chapterNumber);
        if (isNaN(num)) return false;
        // Skip if chapter already exists in our database for this series
        if (existingChapterNumbers.has(num) || seenNumbers.has(num)) {
          details.push({
            chapter: chapter.chapterNumber,
            status: "skipped",
            message: "Chapter already exists in database",
            series_title: seriesTitle || undefined,
          });
          return false;
        }
        seenNumbers.add(num);
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    const importMode = validated.mode || "latest";
    const limit = importMode === "all" ? (validated.maxChapters ?? 500) : Math.min(validated.maxChapters ?? 10, 10);

    // "latest" mode takes the highest chapter numbers (newest releases)
    // "all" mode takes all missing chapters across the entire catalog
    const missing =
      importMode === "latest"
        ? missingCandidates.length > limit
          ? missingCandidates.slice(missingCandidates.length - limit)
          : [...missingCandidates]
        : missingCandidates.slice(0, limit);

    skipped = discovered.length - missing.length;
    let batchExtractedImages = new Map<string, string[]>();
    if (missing.length > 0) {
      const isAsuraSource = source.source_url.toLowerCase().includes('asura');
      const isElftoonSource = isElftoonUrl(source.source_url);
      const isDuskSource = source.source_url.toLowerCase().includes('duskscans');
      const batchConcurrency = isAsuraSource ? 6 : isDuskSource ? 15 : isElftoonSource ? 15 : 10;
      batchExtractedImages = await extractImagesFromChapterUrls(
        missing.map((chapter) => chapter.url),
        { concurrency: batchConcurrency, imageUrlExample },
      );
    }

    // First pass: collect all chapter data + images, filtering out failures
    const chapterRows: Array<{
      series_id: any;
      chapter_number: number;
      title: string | null;
      slug: string;
      chapter_type: string;
      status: string;
      scheduled_at?: string | null;
      source_url?: string | null;
      uploaded_by: string | null;
      scanlation_group: string;
    }> = [];
    const chapterImages = new Map<string, string[]>();

    for (const chapter of missing) {
      try {
        const rawImages =
          batchExtractedImages.get(chapter.url) ??
          (await extractImagesFromChapterUrl(chapter.url, {
            imageUrlExample,
          }));
        const images = filterImagesByExampleUrl(rawImages, imageUrlExample || "");
        if (images.length === 0) {
          throw new Error("No images matching the source image pattern were found");
        }

        const targetSlug = buildChapterSlug(chapter.chapterNumber, {
          title: chapter.title || null,
          scanlationGroup,
        });

        // Set unlock delay: hold chapter for 30 minutes with countdown and direct source link
        const unlockDelayMinutes = 30;
        const scheduledAt = new Date(Date.now() + unlockDelayMinutes * 60 * 1000).toISOString();

        chapterRows.push({
          series_id: source.series_id,
          chapter_number: chapter.chapterNumber,
          title: chapter.title || null,
          slug: targetSlug,
          chapter_type: "image",
          status: "published",
          scheduled_at: scheduledAt,
          source_url: chapter.url,
          uploaded_by: uploaderUsername,
          scanlation_group: scanlationGroup,
        });
        chapterImages.set(chapterScanKey(chapter.chapterNumber, scanlationGroup), images);
      } catch (chapterError) {
        failed++;
        details.push({
          chapter: chapter.chapterNumber,
          status: "failed",
          message: chapterError instanceof Error ? chapterError.message : "Unknown error",
          series_title: seriesTitle || undefined,
        });
      }
    }

    // Bulk insert all chapters with resilient fallback
    if (chapterRows.length > 0) {
      let insertedList: any[] = [];
      const { data: insertedChapters, error: chapterInsertError } = await admin
        .from("chapters")
        .insert(chapterRows)
        .select("id,chapter_number,scanlation_group");

      let insertErr = chapterInsertError;

      if (insertErr && (insertErr.code === "42703" || insertErr.message?.includes("source_url"))) {
        console.warn("[SyncImport] source_url column error on chapters table, retrying without source_url...");
        const fallbackRows = chapterRows.map(({ source_url, ...rest }) => rest);
        const retryRes = await admin
          .from("chapters")
          .insert(fallbackRows)
          .select("id,chapter_number,scanlation_group");
        if (!retryRes.error) {
          insertedList = retryRes.data ?? [];
          insertErr = null;
        } else {
          insertErr = retryRes.error;
        }
      } else if (!insertErr) {
        insertedList = insertedChapters ?? [];
      }

      // If bulk insert still failed, retry row-by-row so valid chapters succeed even if one fails
      if (insertErr && insertedList.length === 0) {
        console.warn("[SyncImport] Bulk insert failed, attempting row-by-row fallback:", insertErr.message);
        for (const row of chapterRows) {
          const { data: singleCh, error: singleErr } = await admin
            .from("chapters")
            .insert(row)
            .select("id,chapter_number,scanlation_group")
            .single();

          if (singleErr && (singleErr.code === "42703" || singleErr.message?.includes("source_url"))) {
            const { source_url, ...fallbackRow } = row;
            const { data: retrySingle, error: retrySingleErr } = await admin
              .from("chapters")
              .insert(fallbackRow)
              .select("id,chapter_number,scanlation_group")
              .single();
            if (!retrySingleErr && retrySingle) {
              insertedList.push(retrySingle);
            } else {
              failed++;
              details.push({
                chapter: row.chapter_number,
                status: "failed",
                message: retrySingleErr?.message || singleErr.message,
                series_title: seriesTitle || undefined,
              });
            }
          } else if (!singleErr && singleCh) {
            insertedList.push(singleCh);
          } else {
            failed++;
            details.push({
              chapter: row.chapter_number,
              status: "failed",
              message: singleErr?.message || "Insert failed",
              series_title: seriesTitle || undefined,
            });
          }
        }
      }

      if (insertedList.length > 0) {
        // Bulk insert all pages directly in chunks of 500
        const pageRows: Array<{ chapter_id: string; page_number: number; image_url: string }> = [];
        for (const chapter of insertedList) {
          const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
          const rawImages = chapterImages.get(key) ?? [];
          rawImages.forEach((url, index) => {
            pageRows.push({
              chapter_id: chapter.id,
              page_number: index + 1,
              image_url: url,
            });
          });
        }

        const CHUNK_SIZE = 500;
        let pagesFailed = false;
        let pagesErrMsg = "";
        for (let i = 0; i < pageRows.length; i += CHUNK_SIZE) {
          const chunk = pageRows.slice(i, i + CHUNK_SIZE);
          const { error: pagesError } = await admin.from("chapter_pages").insert(chunk);
          if (pagesError) {
            pagesFailed = true;
            pagesErrMsg = pagesError.message;
            break;
          }
        }

        if (pagesFailed) {
          for (const chapter of insertedList) {
            failed++;
            details.push({
              chapter: Number(chapter.chapter_number),
              status: "failed",
              message: pagesErrMsg,
              series_title: seriesTitle || undefined,
            });
          }
        } else {
          imported += insertedList.length;
          for (const chapter of insertedList) {
            const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
            const images = chapterImages.get(key) ?? [];
            details.push({
              chapter: Number(chapter.chapter_number),
              status: "imported",
              pages: images.length,
              series_title: seriesTitle || undefined,
            });
            existingKeys.add(key);
          }
        }
      }
    }

    const durationSeconds = Math.max(1, Math.round((new Date().getTime() - new Date(startedAt).getTime()) / 1000));
    const status = failed > 0 && imported > 0 ? "partial" : failed > 0 ? "failed" : "success";
    const message =
      imported > 0
        ? `Imported ${imported} new chapter${imported !== 1 ? "s" : ""} (Found ${chaptersFound} on source, ${skipped} already in DB)${seriesTitle ? ` for ${seriesTitle}` : ""}.`
        : chaptersFound > 0
          ? `Checked source: all ${chaptersFound} chapters already in database${seriesTitle ? ` for ${seriesTitle}` : ""}.`
          : `No chapters found on source${seriesTitle ? ` for ${seriesTitle}` : ""}.`;

    await admin.from("series_import_logs").insert({
      source_id: source.id,
      status,
      message,
      chapters_found: chaptersFound,
      chapters_imported: imported,
      chapters_skipped: skipped,
      chapters_failed: failed,
      duration_seconds: durationSeconds,
      details,
    });

    // 5. Scan source update timing and update Estimated Next Release time
    let timingCadence: string | undefined;
    let nextScheduledDrop: string | undefined;
    try {
      const maxChapterInDb = Math.max(
        0,
        ...activeRows.map((r: any) => Number(r.chapter_number) || 0),
        ...chapterRows.map((r: any) => Number(r.chapter_number) || 0)
      );

      const timing = await detectSourceScanTiming({
        seriesTitle: seriesTitle || "",
        sourceUrl: source.source_url,
        currentMaxChapter: maxChapterInDb,
        localChapters: activeRows,
      });

      timingCadence = timing.cadence;
      nextScheduledDrop = timing.estimatedNextRelease;

      if (imported > 0) {
        nextScheduledDrop = advanceNextReleaseAfterDrop(timing.estimatedNextRelease, timing.cadence);
      }

      await admin
        .from("series_import_sources")
        .update({
          last_checked_at: startedAt,
          last_success_at: imported > 0 || failed === 0 ? startedAt : source.last_success_at,
          last_error: failed > 0 && imported === 0 ? details.find((entry) => entry.status === "failed")?.message : null,
          estimated_next_release_at: nextScheduledDrop,
          release_cadence: timingCadence,
          last_scanned_timing_at: startedAt,
        })
        .eq("id", source.id);

      if (source.series_id) {
        const seriesUpdate: Record<string, any> = {
          estimated_next_release_at: nextScheduledDrop,
          release_cadence: timingCadence,
        };
        if (imported > 0) {
          seriesUpdate.updated_at = new Date().toISOString();
        }
        await admin
          .from("series")
          .update(seriesUpdate)
          .eq("id", source.series_id);
      }
    } catch (timingErr) {
      console.warn("[Scraper] Failed to detect/update scan timing for source:", timingErr);
      await admin
        .from("series_import_sources")
        .update({
          last_checked_at: startedAt,
          last_success_at: imported > 0 || failed === 0 ? startedAt : source.last_success_at,
          last_error: failed > 0 && imported === 0 ? details.find((entry) => entry.status === "failed")?.message : null,
        })
        .eq("id", source.id);
    }

    return {
      success: true,
      chaptersFound,
      imported,
      skipped,
      failed,
      mode: importMode,
      totalMissing: missingCandidates.length,
      details,
    };
  } catch (error) {
    const rawError = error instanceof Error ? error.message : "Sync failed";
    const message = seriesTitle ? `${rawError} (${seriesTitle})` : rawError;
    await admin.from("series_import_logs").insert({
      source_id: source.id,
      status: "failed",
      message,
      chapters_found: chaptersFound,
      chapters_imported: imported,
      chapters_skipped: skipped,
      chapters_failed: failed || 1,
      details,
    });
    await admin
      .from("series_import_sources")
      .update({ last_checked_at: startedAt, last_error: message })
      .eq("id", source.id);

    return { success: false, error: message };
  }
  } catch (outerError) {
    console.error("[SyncImportSource] Unhandled error:", outerError);
    const message = outerError instanceof Error ? outerError.message : "Sync failed";
    return { success: false, error: message };
  }
}

export async function $syncAllSeriesImportSources(args: {
  data: {
    accessToken: string;
    maxChaptersPerSeries?: number;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        accessToken: z.string().min(1),
        maxChaptersPerSeries: z.number().int().min(1).max(500).optional(),
      })
      .parse(data);

    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    const { data: sources, error } = await admin
      .from("series_import_sources")
      .select("id, series_id, source_url, source_site, scanlation_group, auto_publish, image_url_example, series:series(id, title, slug, cover_url)")
      .eq("enabled", true);

    if (error) throw error;
    if (!sources || sources.length === 0) {
      return {
        success: true,
        message: "No enabled import sources found in database",
        totalSources: 0,
        totalImported: 0,
        results: [],
      };
    }

    const results: Array<{
      sourceId: string;
      seriesId: string;
      seriesTitle: string;
      seriesSlug?: string;
      coverUrl?: string | null;
      sourceUrl: string;
      chaptersFound: number;
      imported: number;
      skipped: number;
      failed: number;
      status: "success" | "partial" | "failed";
      error?: string;
      details?: Array<{ chapter: number; status: string; message?: string; pages?: number }>;
    }> = [];

    let totalImported = 0;

    for (const source of sources) {
      const seriesInfo = (source as any).series;
      const seriesTitle = seriesInfo?.title || "Unknown Series";
      const seriesSlug = seriesInfo?.slug;
      const coverUrl = seriesInfo?.cover_url;

      const syncRes = await $syncImportSource({
        data: {
          sourceId: source.id,
          accessToken: validated.accessToken,
          maxChapters: validated.maxChaptersPerSeries ?? 50,
        },
      });

      if (syncRes.success) {
        totalImported += syncRes.imported ?? 0;
        const status = (syncRes.failed ?? 0) > 0 && (syncRes.imported ?? 0) > 0 ? "partial" : (syncRes.failed ?? 0) > 0 ? "failed" : "success";
        results.push({
          sourceId: source.id,
          seriesId: source.series_id,
          seriesTitle,
          seriesSlug,
          coverUrl,
          sourceUrl: source.source_url,
          chaptersFound: syncRes.chaptersFound ?? 0,
          imported: syncRes.imported ?? 0,
          skipped: syncRes.skipped ?? 0,
          failed: syncRes.failed ?? 0,
          status,
          details: syncRes.details,
        });
      } else {
        results.push({
          sourceId: source.id,
          seriesId: source.series_id,
          seriesTitle,
          seriesSlug,
          coverUrl,
          sourceUrl: source.source_url,
          chaptersFound: 0,
          imported: 0,
          skipped: 0,
          failed: 1,
          status: "failed",
          error: syncRes.error,
          details: syncRes.details,
        });
      }
    }

    return {
      success: true,
      totalSources: sources.length,
      totalImported,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync all series",
    };
  }
}

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${normalizeScanlationGroup(scanlationGroup)}`;
}

function isPremiumChapter(chapter: { chapterNumber: number; title?: string; url: string }): boolean {
  return isPremiumOrLockedChapter(chapter);
}

function inferSourceGroup(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function filterImagesByExampleUrl(images: string[], exampleUrl: string) {
  if (!exampleUrl) return images;

  if (isQimanhwaUrl(exampleUrl)) {
    const numberedImages = images.filter(
      (url) => isQimanhwaUrl(url) && isNumberedImageUrl(url) && isQimanhwaReaderPath(url),
    );
    if (numberedImages.length > 0) return numberedImages;
    // Fallback: if already numbered from Qi domain, keep them even if directory structure evolves
    const qiNumbered = images.filter((url) => isQimanhwaUrl(url) && isNumberedImageUrl(url));
    if (qiNumbered.length > 0) return qiNumbered;
  }

  if (isKaynScansUrl(exampleUrl)) {
    const kaynImages = images.filter(
      (url) => isKaynScansUrl(url) && (url.includes("/uploads/series/") || url.includes("/upload/series/")),
    );
    if (kaynImages.length > 0) return kaynImages;
  }

  if (isDrakeComicUrl(exampleUrl)) {
    const drakeImages = images.filter(
      (url) => isDrakeComicUrl(url) && (url.includes("/uploads/series/") || url.includes("/upload/series/")),
    );
    if (drakeImages.length > 0) return drakeImages;
  }

  if (isWitchToonsUrl(exampleUrl)) {
    const wtImages = images.filter(
      (url) => isWitchToonsUrl(url) && (url.includes("/uploads/comic-pages/") || url.includes("/uploads/series/")),
    );
    if (wtImages.length > 0) return wtImages;
  }

  if (isDuskScansUrl(exampleUrl)) {
    const dsImages = images.filter(
      (url) => isDuskScansUrl(url) && url.includes("/storage/uploads/chapters/"),
    );
    if (dsImages.length > 0) return dsImages;
  }

  if (isElftoonUrl(exampleUrl)) {
    const elfImages = images.filter(
      (url) => isElftoonUrl(url) && url.toLowerCase().includes('/wp-content/uploads/'),
    );
    if (elfImages.length > 0) return elfImages;
  }

  if (exampleUrl.toLowerCase().includes("vortex")) {
    return images;
  }

  const prefix = getImageUrlTypePrefix(exampleUrl);
  if (!prefix) return images;

  const prefixMatches = images.filter((url) => url.startsWith(prefix));
  if (prefixMatches.length > 0) return prefixMatches;

  try {
    const origin = new URL(exampleUrl).origin;
    const originMatches = images.filter((url) => {
      try {
        return new URL(url).origin === origin;
      } catch {
        return url.startsWith(origin);
      }
    });
    if (originMatches.length > 0) return originMatches;
  } catch {
    return images;
  }

  return images;
}

function getImageUrlTypePrefix(exampleUrl: string): string | null {
  try {
    const parsed = new URL(exampleUrl.trim());
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      return `${parsed.origin}/${segments.slice(0, 3).join("/")}/`;
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/[^/]*$/, "/")}`;
  } catch {
    return null;
  }
}

function isQimanhwaUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname.includes("qimanhwa.com") ||
      hostname.includes("qiscans.org") ||
      hostname.includes("qimanga.com")
    );
  } catch {
    const lower = url.toLowerCase();
    return lower.includes("qimanhwa.com") || lower.includes("qiscans") || lower.includes("qimanga");
  }
}

function isKaynScansUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("kaynscans") || hostname.includes("kaynscan");
  } catch {
    return url.toLowerCase().includes("kaynscans") || url.toLowerCase().includes("kaynscan");
  }
}

function isDrakeComicUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("drakecomic");
  } catch {
    return url.toLowerCase().includes("drakecomic");
  }
}

function isWitchToonsUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("witchtoons.net") || hostname.includes("witchtoons");
  } catch {
    return url.toLowerCase().includes("witchtoons");
  }
}

function isDuskScansUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("duskscans.com") || hostname.includes("duskscans");
  } catch {
    return url.toLowerCase().includes("duskscans");
  }
}

function isNumberedImageUrl(url: string) {
  try {
    const filename = new URL(url).pathname.split("/").pop() ?? "";
    return /^(?:page[_-]?)?\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
  } catch {
    return false;
  }
}

function isQimanhwaReaderPath(url: string) {
  const lowercaseUrl = url.toLowerCase();
  return (
    lowercaseUrl.includes("/file/qiscans/upload/rezo/series/") ||
    lowercaseUrl.includes("/rezo/series/") ||
    lowercaseUrl.includes("/file/qiscans/upload/upload/series/") ||
    lowercaseUrl.includes("/upload/upload/series/") ||
    lowercaseUrl.includes("/file/qiscans/upload/series/") ||
    lowercaseUrl.includes("/file/qimanga/upload/series/") ||
    lowercaseUrl.includes("/file/qiscans/upload/") ||
    lowercaseUrl.includes("/file/qimanga/upload/") ||
    lowercaseUrl.includes("/upload/series/") ||
    lowercaseUrl.includes("/uploads/series/") ||
    lowercaseUrl.includes("quantumscans")
  );
}

/**
 * Delete a single chapter with admin authentication
 */
export async function $deleteChapter(args: {
  data: { chapterId: string; accessToken: string };
}) {
  try {
    await verifyAdmin(args.data.accessToken);
    const admin = getAdminSupabase();

    const { data: chapter } = await admin
      .from("chapters")
      .select("id, series_id, chapter_number, title")
      .eq("id", args.data.chapterId)
      .single();

    const { error } = await admin
      .from("chapters")
      .delete()
      .eq("id", args.data.chapterId);

    if (error) throw error;

    return {
      success: true,
      message: `Chapter ${chapter?.chapter_number ?? ""} deleted successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete chapter",
    };
  }
}

/** Re-scrape and refresh a reported chapter without deleting its chapter row or reader references. */
export async function $repairReportedChapter(args: {
  data: { chapterId: string; internalSecret: string };
}) {
  try {
    const expectedSecret = process.env.TELEGRAM_ACTION_SECRET;
    if (!expectedSecret || !matchesInternalActionSecret(args.data.internalSecret, expectedSecret)) {
      return { success: false, error: "Unauthorized chapter repair request" };
    }
    const { chapterId } = z.object({ chapterId: z.string().uuid(), internalSecret: z.string().min(32) }).parse(args.data);
    const admin = getAdminSupabase();
    const { data: chapter, error: chapterError } = await admin
      .from("chapters")
      .select("id,series_id,chapter_number,title,slug,chapter_type,source_url,scanlation_group,series:series(title,slug),chapter_pages(id,page_number,image_url)")
      .eq("id", chapterId)
      .maybeSingle();
    if (chapterError) throw chapterError;
    if (!chapter) return { success: false, error: "Reported chapter no longer exists" };
    if (chapter.chapter_type !== "image") return { success: false, error: "Automatic repair only supports image chapters" };

    let sourceUrl = chapter.source_url || "";
    let imageUrlExample = sourceUrl ? detectImportSource(sourceUrl).imageUrlExample || "" : "";
    if (!sourceUrl) {
      const { data: sources, error: sourcesError } = await admin
        .from("series_import_sources")
        .select("source_url,scanlation_group,image_url_example")
        .eq("series_id", chapter.series_id)
        .eq("enabled", true)
        .order("last_success_at", { ascending: false, nullsFirst: false });
      if (sourcesError) throw sourcesError;

      for (const source of sources || []) {
        const discovered = await extractChaptersFromSeriesUrl(source.source_url);
        const sourceGroup = normalizeScanlationGroup(source.scanlation_group || "");
        const targetGroup = normalizeScanlationGroup(chapter.scanlation_group || "");
        const match = discovered.find((candidate) =>
          Number(candidate.chapterNumber) === Number(chapter.chapter_number)
          && (!sourceGroup || !targetGroup || sourceGroup === targetGroup)
          && (!candidate.scanGroup || !targetGroup || normalizeScanlationGroup(candidate.scanGroup) === targetGroup),
        );
        if (match) {
          sourceUrl = match.url;
          imageUrlExample = source.image_url_example || detectImportSource(source.source_url).imageUrlExample || "";
          break;
        }
      }
    }
    if (!sourceUrl) return { success: false, error: "No source URL was saved and no matching import source could be found" };

    const rawImages = await extractImagesFromChapterUrl(sourceUrl, { imageUrlExample: imageUrlExample || null });
    const images = filterImagesByExampleUrl(rawImages, imageUrlExample).slice(0, 300);
    if (!images.length) return { success: false, error: "The chapter source returned no usable reader images" };

    const series = Array.isArray(chapter.series) ? chapter.series[0] : chapter.series;
    if (!series?.slug) return { success: false, error: "The chapter's series record is unavailable" };
    const uploadedImages = await mirrorPagesForChapter(admin, series.slug, chapter.slug, images, true);
    const uploadedCount = uploadedImages.filter((image, index) => image !== images[index]).length;
    if (uploadedImages.length !== images.length || uploadedCount !== images.length) {
      return { success: false, error: "The source pages were found, but not all pages could be re-uploaded to site storage" };
    }

    const { error: upsertError } = await admin.from("chapter_pages").upsert(
      uploadedImages.map((image_url, index) => ({ chapter_id: chapter.id, page_number: index + 1, image_url })),
      { onConflict: "chapter_id,page_number" },
    );
    if (upsertError) throw upsertError;

    const { error: stalePagesError } = await admin
      .from("chapter_pages")
      .delete()
      .eq("chapter_id", chapter.id)
      .gt("page_number", uploadedImages.length);
    if (stalePagesError) throw stalePagesError;

    const { count, error: verifyError } = await admin
      .from("chapter_pages")
      .select("id", { count: "exact", head: true })
      .eq("chapter_id", chapter.id);
    if (verifyError) throw verifyError;
    if (count !== uploadedImages.length) return { success: false, error: "The refreshed page count did not verify" };

    return {
      success: true,
      seriesTitle: series.title || "Unknown series",
      chapterNumber: Number(chapter.chapter_number),
      pageCount: uploadedImages.length,
      message: `Re-scraped and re-uploaded ${uploadedImages.length} pages`,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Automatic chapter repair failed" };
  }
}

/**
 * Bulk delete multiple chapters with admin authentication
 */
export async function $bulkDeleteChapters(args: {
  data: { chapterIds: string[]; accessToken: string };
}) {
  try {
    await verifyAdmin(args.data.accessToken);
    const admin = getAdminSupabase();

    if (!args.data.chapterIds || args.data.chapterIds.length === 0) {
      return { success: false, error: "No chapters selected" };
    }

    const { error } = await admin
      .from("chapters")
      .delete()
      .in("id", args.data.chapterIds);

    if (error) throw error;

    return {
      success: true,
      message: `Deleted ${args.data.chapterIds.length} chapter(s) successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk delete chapters",
    };
  }
}

/**
 * Discover chapters from a source URL and return only NEW ones not already in the database.
 * Used by Telegram bot /import command and LiveSeriesEditor chapter selection.
 */
export async function $discoverNewChapters(args: {
  data: {
    sourceId?: string;
    seriesId?: string;
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const token = z.string().min(1).parse(data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const admin = getAdminSupabase();
    let source: any;

    if (data.sourceId) {
      const { data: src, error } = await admin
        .from("series_import_sources")
        .select("*, series:series(id, title, slug)")
        .eq("id", data.sourceId)
        .single();
      if (error || !src) return { success: false, error: "Import source not found" };
      source = src;
    } else if (data.seriesId) {
      const { data: sources, error } = await admin
        .from("series_import_sources")
        .select("*, series:series(id, title, slug)")
        .eq("series_id", data.seriesId)
        .eq("enabled", true)
        .order("last_success_at", { ascending: false, nullsFirst: false })
        .limit(1);
      if (error || !sources?.length) return { success: false, error: "No enabled import source found for this series" };
      source = sources[0];
    } else {
      return { success: false, error: "Either sourceId or seriesId is required" };
    }

    const seriesTitle = source?.series?.title || "Unknown";
    const preset = detectImportSource(source.source_url);
    const scanlationGroup = source.scanlation_group || preset.scanlationGroup || null;

    const allDiscovered = await extractChaptersFromSeriesUrl(source.source_url);
    const discovered = allDiscovered.filter((ch) => !isPremiumChapter(ch));

    const { data: existingRows, error: existingError } = await admin
      .from("chapters")
      .select("id,chapter_number,scanlation_group,chapter_type")
      .eq("series_id", source.series_id);
    if (existingError) throw existingError;

    const activeRows = existingRows ?? [];

    const existingSet = new Set(
      activeRows.map((ch: any) => Number(ch.chapter_number))
    );

    const seenNumbers = new Set<number>();
    const newChapters = discovered
      .filter((chapter) => {
        const num = Number(chapter.chapterNumber);
        if (isNaN(num) || existingSet.has(num) || seenNumbers.has(num)) return false;
        seenNumbers.add(num);
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    const existingChapterNumbers = activeRows
      .map((ch: any) => Number(ch.chapter_number))
      .sort((a: number, b: number) => a - b);

    return {
      success: true,
      seriesTitle,
      seriesId: source.series_id,
      sourceId: source.id,
      sourceUrl: source.source_url,
      sourceSite: source.source_site || preset.sourceSite || "Unknown",
      totalDiscovered: discovered.length,
      totalExisting: activeRows.length,
      totalNew: newChapters.length,
      premiumSkipped: allDiscovered.length - discovered.length,
      newChapters: newChapters.map((ch) => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title || null,
        url: ch.url,
      })),
      existingChapterNumbers,
      latestExisting: existingChapterNumbers.length > 0 ? existingChapterNumbers[existingChapterNumbers.length - 1] : null,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to discover chapters" };
  }
}

/**
 * Import specific chapter numbers from a source.
 * Used by Telegram bot /import command for selective chapter import.
 */
export async function $importSelectedChapters(args: {
  data: {
    sourceId: string;
    chapterNumbers: number[];
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const token = z.string().min(1).parse(data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const validated = z.object({
      sourceId: z.string().uuid(),
      chapterNumbers: z.array(z.number()).min(1).max(50),
    }).parse({ sourceId: data.sourceId, chapterNumbers: data.chapterNumbers });

    const admin = getAdminSupabase();

    const { data: source, error: sourceError } = await admin
      .from("series_import_sources")
      .select("*, series:series(id, title, slug, cover_url)")
      .eq("id", validated.sourceId)
      .single();
    if (sourceError || !source) return { success: false, error: "Import source not found" };

    const seriesTitle = source?.series?.title || "";
    const preset = detectImportSource(source.source_url);
    const scanlationGroup = source.scanlation_group || preset.scanlationGroup || null;
    const imageUrlExample = source.image_url_example || preset.imageUrlExample || null;

    const allDiscovered = await extractChaptersFromSeriesUrl(source.source_url);
    const discovered = allDiscovered.filter((ch) => !isPremiumChapter(ch));

    // Filter to only the requested chapter numbers
    const requestedSet = new Set(validated.chapterNumbers);
    const chaptersToImport = discovered.filter((ch) => requestedSet.has(ch.chapterNumber));

    if (chaptersToImport.length === 0) {
      return { success: false, error: "None of the requested chapters were found on the source" };
    }

    // Verify they don't already exist
    const { data: existingRows, error: existingError } = await admin
      .from("chapters")
      .select("id,chapter_number,scanlation_group,chapter_type")
      .eq("series_id", source.series_id);
    if (existingError) throw existingError;

    const existingChapterNumbers = new Set(
      (existingRows ?? []).map((ch: any) => Number(ch.chapter_number))
    );

    const missing = chaptersToImport.filter((ch) => {
      const num = Number(ch.chapterNumber);
      return !isNaN(num) && !existingChapterNumbers.has(num);
    });

    if (missing.length === 0) {
      return { success: true, imported: 0, failed: 0, message: "All requested chapters already exist in the database", details: [] };
    }

    const isAsuraSource = source.source_url.toLowerCase().includes("asura");
    const batchExtractedImages = await extractImagesFromChapterUrls(
      missing.map((ch) => ch.url),
      { concurrency: isAsuraSource ? 6 : 10, imageUrlExample },
    );

    let imported = 0;
    let failed = 0;
    const details: Array<{ chapter: number; status: string; message?: string; pages?: number }> = [];

    for (const chapter of missing) {
      try {
        const rawImages = batchExtractedImages.get(chapter.url) ??
          (await extractImagesFromChapterUrl(chapter.url, { imageUrlExample }));
        const images = filterImagesByExampleUrl(rawImages, imageUrlExample || "");
        if (images.length === 0) throw new Error("No images found");

        const slug = buildChapterSlug(chapter.chapterNumber, {
          title: chapter.title || null,
          scanlationGroup,
        });

        const scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const chapterPayload: any = {
          series_id: source.series_id,
          chapter_number: chapter.chapterNumber,
          title: chapter.title || null,
          slug,
          chapter_type: "image",
          status: "published",
          scheduled_at: scheduledAt,
          source_url: chapter.url,
          uploaded_by: "vnr610",
          scanlation_group: scanlationGroup,
        };

        let chapterRecord: any;
        const { data: insertedRecord, error: chapterError } = await admin
          .from("chapters")
          .insert(chapterPayload)
          .select("id")
          .single();

        if (chapterError) {
          if (chapterError.code === "42703" || chapterError.message?.includes("source_url")) {
            delete chapterPayload.source_url;
            const { data: retryData, error: retryError } = await admin
              .from("chapters")
              .insert(chapterPayload)
              .select("id")
              .single();
            if (retryError) throw retryError;
            chapterRecord = retryData;
          } else {
            throw chapterError;
          }
        } else {
          chapterRecord = insertedRecord;
        }

        const { error: pagesError } = await admin.from("chapter_pages").insert(
          images.map((imageUrl, index) => ({
            chapter_id: chapterRecord.id,
            page_number: index + 1,
            image_url: imageUrl,
          })),
        );
        if (pagesError) throw pagesError;

        imported++;
        details.push({ chapter: chapter.chapterNumber, status: "imported", pages: images.length });
      } catch (error) {
        failed++;
        details.push({
          chapter: chapter.chapterNumber,
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success: true, imported, failed, seriesTitle, details };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Selective import failed" };
  }
}

/**
 * List all enabled import sources with their status.
 * Used by Telegram bot /sources command.
 */
export async function $getImportSources(args: {
  data: { accessToken: string };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const admin = getAdminSupabase();
    const { data: sources, error } = await admin
      .from("series_import_sources")
      .select("id, source_url, source_site, scanlation_group, enabled, last_checked_at, last_success_at, last_error, estimated_next_release_at, release_cadence, series:series(id, title, slug)")
      .eq("enabled", true)
      .order("last_checked_at", { ascending: true, nullsFirst: true });

    if (error) throw error;

    return {
      success: true,
      totalSources: sources?.length ?? 0,
      sources: (sources ?? []).map((src: any) => ({
        id: src.id,
        seriesTitle: src.series?.title || "Unknown",
        seriesSlug: src.series?.slug || "",
        sourceSite: src.source_site || "Unknown",
        sourceUrl: src.source_url,
        scanlationGroup: src.scanlation_group || null,
        lastChecked: src.last_checked_at || null,
        lastSuccess: src.last_success_at || null,
        lastError: src.last_error || null,
        nextRelease: src.estimated_next_release_at || null,
        cadence: src.release_cadence || null,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to list sources" };
  }
}

/**
 * Get per-series import status including latest chapter, next release, and last scan info.
 * Used by Telegram bot /status command.
 */
export async function $getSeriesImportStatus(args: {
  data: { query: string; accessToken: string };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const query = z.string().min(2).max(100).parse(args.data.query);
    const admin = getAdminSupabase();

    const escaped = query.replace(/[,*()%]/g, " ").replace(/\s+/g, " ").trim();
    const { data: seriesList, error } = await admin
      .from("series")
      .select("id, title, slug, status, chapter_count, estimated_next_release_at, release_cadence, updated_at, is_hidden")
      .or(`title.ilike.%${escaped}%,alternative_titles.ilike.%${escaped}%`)
      .limit(5);

    if (error) throw error;
    if (!seriesList || seriesList.length === 0) return { success: true, found: 0, results: [] };

    const results = [];
    for (const series of seriesList) {
      const { data: latestChapter } = await admin
        .from("chapters")
        .select("chapter_number, title, created_at")
        .eq("series_id", series.id)
        .eq("status", "published")
        .order("chapter_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: importSource } = await admin
        .from("series_import_sources")
        .select("id, source_site, source_url, last_checked_at, last_success_at, last_error, estimated_next_release_at, release_cadence")
        .eq("series_id", series.id)
        .eq("enabled", true)
        .order("last_success_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      results.push({
        title: series.title,
        slug: series.slug,
        status: series.status,
        isHidden: series.is_hidden,
        chapterCount: series.chapter_count ?? 0,
        latestChapter: latestChapter ? {
          number: latestChapter.chapter_number,
          title: latestChapter.title,
          importedAt: latestChapter.created_at,
        } : null,
        source: importSource ? {
          site: importSource.source_site,
          lastChecked: importSource.last_checked_at,
          lastSuccess: importSource.last_success_at,
          lastError: importSource.last_error,
          nextRelease: importSource.estimated_next_release_at,
          cadence: importSource.release_cadence,
        } : null,
      });
    }

    return { success: true, found: results.length, results };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get series status" };
  }
}

/**
 * Get recent import log entries.
 * Used by Telegram bot /logs command.
 */
export async function $getRecentImportLogs(args: {
  data: { accessToken: string; limit?: number };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const limit = Math.min(args.data.limit ?? 5, 10);
    const admin = getAdminSupabase();

    const { data: logs, error } = await admin
      .from("series_import_logs")
      .select("id, status, message, chapters_found, chapters_imported, chapters_skipped, chapters_failed, created_at, duration_seconds, source:series_import_sources(source_site, series:series(title))")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      logs: (logs ?? []).map((log: any) => ({
        status: log.status,
        message: log.message,
        found: log.chapters_found,
        imported: log.chapters_imported,
        skipped: log.chapters_skipped,
        failed: log.chapters_failed,
        at: log.created_at,
        duration: log.duration_seconds,
        sourceSite: log.source?.source_site || "Unknown",
        seriesTitle: log.source?.series?.title || "Unknown",
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get import logs" };
  }
}

/**
 * Trigger import for a specific series by its ID.
 * Used by Comick watcher auto-import and Telegram /import-all command.
 */
export async function $triggerSeriesImport(args: {
  data: {
    seriesId: string;
    accessToken: string;
    maxChapters?: number;
    mode?: "latest" | "all";
  };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const admin = getAdminSupabase();
    const { data: sources, error } = await admin
      .from("series_import_sources")
      .select("id")
      .eq("series_id", args.data.seriesId)
      .eq("enabled", true)
      .order("last_success_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) throw error;
    if (!sources?.length) return { success: false, error: "No enabled import source found for this series" };

    return await $syncImportSource({
      data: {
        sourceId: sources[0].id,
        accessToken: token,
        maxChapters: args.data.maxChapters ?? 10,
        mode: args.data.mode ?? "latest",
      },
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to trigger import" };
  }
}

/**
 * Sync all series import sources that are due on their Estimated Next Release Time.
 */
export async function $syncDueScheduledSeries(args: {
  data: {
    accessToken: string;
    forceAll?: boolean;
    maxChaptersPerSeries?: number;
    maxSourcesPerRun?: number;
  };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const admin = getAdminSupabase();

    // Fetch all enabled import sources
    const { data: sources, error } = await admin
      .from("series_import_sources")
      .select("*, series:series(id, title, slug, cover_url)")
      .eq("enabled", true);

    if (error) throw error;
    if (!sources || sources.length === 0) {
      return {
        success: true,
        message: "No enabled import sources found.",
        totalProcessed: 0,
        totalImported: 0,
        totalDue: 0,
        totalEligible: 0,
        totalPending: 0,
        results: [],
      };
    }

    const forceAll = args?.data?.forceAll ?? false;
    const eligibleSources = forceAll
      ? sources
      : sources.filter((s) => isSourceDueForScraping(s));
    eligibleSources.sort((a, b) => {
      const checkedA = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0;
      const checkedB = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0;
      return checkedA - checkedB;
    });
    const configuredLimit = args?.data?.maxSourcesPerRun;
    const maxSources = forceAll
      ? eligibleSources.length
      : Math.max(1, Math.min(20, Math.floor(configuredLimit || eligibleSources.length)));
    const dueSources = eligibleSources.slice(0, maxSources);

    console.log(`[ScheduledImporter] Checking ${dueSources.length} of ${eligibleSources.length} due sources (${sources.length} enabled).`);

    const results = [];
    let totalImported = 0;

    for (const source of dueSources) {
      const seriesTitle = (source as any)?.series?.title || "Unknown Series";
      console.log(`[ScheduledImporter] Checking ${seriesTitle} (${source.source_url})...`);

      const syncRes = await $syncImportSource({
        data: {
          sourceId: source.id,
          accessToken: token,
          maxChapters: args?.data?.maxChaptersPerSeries ?? 25,
        },
      });

      if (syncRes.success) {
        totalImported += syncRes.imported ?? 0;
        results.push({
          sourceId: source.id,
          seriesTitle,
          imported: syncRes.imported ?? 0,
          status: syncRes.failed && syncRes.failed > 0 ? "partial" : "success",
        });
      } else {
        results.push({
          sourceId: source.id,
          seriesTitle,
          imported: 0,
          status: "failed",
          error: syncRes.error,
        });
      }
    }

    return {
      success: true,
      totalDue: dueSources.length,
      totalEligible: eligibleSources.length,
      totalPending: Math.max(0, eligibleSources.length - dueSources.length),
      totalProcessed: results.length,
      totalImported,
      results,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Scheduled sync failed",
    };
  }
}

/**
 * Scan all series to recalculate and refresh their Estimated Next Release timing.
 */
export async function $scanAllSeriesTimings(args: {
  data: { accessToken: string };
}) {
  try {
    const token = z.string().min(1).parse(args.data.accessToken);
    if (!isInternalActionToken(token)) {
      await verifyAdmin(token);
    }

    const admin = getAdminSupabase();

    const { data: sources, error } = await admin
      .from("series_import_sources")
      .select("*, series:series(id, title, slug)")
      .eq("enabled", true);

    if (error) throw error;
    if (!sources || sources.length === 0) {
      return { success: true, message: "No sources found", updated: 0 };
    }

    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const source of sources) {
      try {
        const seriesTitle = (source as any)?.series?.title || "";
        if (!seriesTitle) continue;

        // Fetch recent chapters for local cadence calculation
        const { data: chapters } = await admin
          .from("chapters")
          .select("chapter_number, created_at")
          .eq("series_id", source.series_id)
          .eq("status", "published")
          .order("chapter_number", { ascending: false })
          .limit(10);

        const maxChapter = Math.max(0, ...(chapters || []).map((c) => Number(c.chapter_number) || 0));

        const timing = await detectSourceScanTiming({
          seriesTitle,
          sourceUrl: source.source_url,
          currentMaxChapter: maxChapter,
          localChapters: chapters || [],
        });

        await admin
          .from("series_import_sources")
          .update({
            estimated_next_release_at: timing.estimatedNextRelease,
            release_cadence: timing.cadence,
            last_scanned_timing_at: now,
          })
          .eq("id", source.id);

        if (source.series_id) {
          await admin
            .from("series")
            .update({
              estimated_next_release_at: timing.estimatedNextRelease,
              release_cadence: timing.cadence,
              updated_at: now,
            })
            .eq("id", source.series_id);
        }

        updatedCount++;
      } catch (e) {
        console.warn(`[TimingScan] Failed for source ${source.id}:`, e);
      }
    }

    return {
      success: true,
      message: `Updated release timings for ${updatedCount} sources.`,
      updated: updatedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to scan timings",
    };
  }
}
