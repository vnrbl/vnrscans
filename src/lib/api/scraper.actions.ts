"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  extractChaptersFromSeriesUrl,
  extractImagesFromChapterUrl,
  extractImagesFromChapterUrls,
} from "../chapter-scraper";
import { buildChapterSlug } from "../chapter-utils";
import { detectImportSource } from "../import-source-utils";

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

  return user;
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

  await verifyAdmin(validated.accessToken);

  const admin = getAdminSupabase();
  const imageUrlExample = validated.imageUrlExample || null;
  const scanlationGroup = validated.scanlationGroup?.trim() || inferSourceGroup(validated.url);
  const uploadedBy = validated.uploader?.trim() || null;

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
    .select("id,chapter_number,scanlation_group,chapter_type,chapter_pages(id)")
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

  // Clean up empty image chapters
  const emptyChapterIds = (existingRows ?? [])
    .filter((ch: any) => ch.chapter_type === "image" && (!ch.chapter_pages || ch.chapter_pages.length === 0))
    .map((ch: any) => ch.id);

  if (emptyChapterIds.length > 0) {
    console.log(`[CloudScrape] Cleaning up ${emptyChapterIds.length} empty chapter(s)...`);
    await admin.from("chapters").delete().in("id", emptyChapterIds);
  }

  const activeRows = (existingRows ?? []).filter((ch: any) => !emptyChapterIds.includes(ch.id));

  const existingChapterNumbers = new Set(
    activeRows.map((chapter: any) => Number(chapter.chapter_number)),
  );
  const existingKeys = new Set(
    activeRows.map((chapter: any) =>
      chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
    ),
  );

  let exactDuplicateCount = 0;
  const seenKeys = new Set<string>();
  const missing = discovered.filter((chapter) => {
    const num = Number(chapter.chapterNumber);
    const key = chapterScanKey(num, scanlationGroup);
    if (existingChapterNumbers.has(num) || existingKeys.has(key) || seenKeys.has(key)) {
      exactDuplicateCount++;
      return false;
    }
    seenKeys.add(key);
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
  const extractedImages = await extractImagesFromChapterUrls(
    missing.map((chapter) => chapter.url),
    { concurrency: isAsura ? 6 : 10, imageUrlExample },
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
    const { data: insertedChapters, error: chapterInsertError } = await admin
      .from("chapters")
      .insert(chapterRows)
      .select("id,chapter_number,scanlation_group");

    if (chapterInsertError) {
      return {
        success: false,
        error: chapterInsertError.message,
        chaptersFound: discovered.length,
        imported: 0,
        skipped: exactDuplicateCount,
        failed: failed + chapterRows.length,
        details,
      };
    }

    const pageRows = (insertedChapters ?? []).flatMap((chapter: any) => {
      const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
      const images = chapterImages.get(key) ?? [];
      return images.map((imageUrl, index) => ({
        chapter_id: chapter.id,
        page_number: index + 1,
        image_url: imageUrl,
      }));
    });

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
  };
}) {
  try {
  const { data } = args;
  const validated = z
    .object({
      sourceId: z.string().uuid(),
      accessToken: z.string().min(1),
      maxChapters: z.number().int().min(1).max(500).optional(),
    })
    .parse(data);

  await verifyAdmin(validated.accessToken);

  const admin = getAdminSupabase();
  const maxChapters = validated.maxChapters ?? 50;
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
      .select("id,chapter_number,scanlation_group,chapter_type,chapter_pages(id)")
      .eq("series_id", source.series_id);

    if (existingError) throw existingError;

    // Clean up empty image chapters
    const emptyChapterIds = (existingRows ?? [])
      .filter((ch: any) => ch.chapter_type === "image" && (!ch.chapter_pages || ch.chapter_pages.length === 0))
      .map((ch: any) => ch.id);

    if (emptyChapterIds.length > 0) {
      console.log(`[SyncImport] Cleaning up ${emptyChapterIds.length} empty chapter(s)...`);
      await admin.from("chapters").delete().in("id", emptyChapterIds);
    }

    const activeRows = (existingRows ?? []).filter((ch: any) => !emptyChapterIds.includes(ch.id));

    const existingChapterNumbers = new Set(
      activeRows.map((chapter: any) => Number(chapter.chapter_number)),
    );
    const existingKeys = new Set(
      activeRows.map((chapter: any) =>
        chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
      ),
    );

    const seenKeys = new Set<string>();
    const missing = discovered
      .filter((chapter) => {
        const num = Number(chapter.chapterNumber);
        const key = chapterScanKey(num, scanlationGroup);
        if (existingChapterNumbers.has(num) || existingKeys.has(key) || seenKeys.has(key)) {
          details.push({
            chapter: chapter.chapterNumber,
            status: "skipped",
            message: "Already imported",
            series_title: seriesTitle || undefined,
          });
          return false;
        }
        seenKeys.add(key);
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .slice(0, maxChapters);

    skipped = discovered.length - missing.length;
    const isAsuraSource = source.source_url.toLowerCase().includes('asura');
    const batchExtractedImages = await extractImagesFromChapterUrls(
      missing.map((chapter) => chapter.url),
      { concurrency: isAsuraSource ? 6 : 10, imageUrlExample },
    );

    // First pass: collect all chapter data + images, filtering out failures
    const chapterRows: Array<{
      series_id: any;
      chapter_number: number;
      title: string | null;
      slug: string;
      chapter_type: string;
      status: string;
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

        chapterRows.push({
          series_id: source.series_id,
          chapter_number: chapter.chapterNumber,
          title: chapter.title || null,
          slug: targetSlug,
          chapter_type: "image",
          status: source.auto_publish ? "published" : "draft",
          uploaded_by: source.source_site || sourcePreset.sourceSite,
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

    // Bulk insert all chapters at once
    if (chapterRows.length > 0) {
      const { data: insertedChapters, error: chapterInsertError } = await admin
        .from("chapters")
        .insert(chapterRows)
        .select("id,chapter_number,scanlation_group");

      if (chapterInsertError) {
        // Bulk insert failed — fall back to counting all prepared rows as failed
        for (const row of chapterRows) {
          failed++;
          details.push({
            chapter: row.chapter_number,
            status: "failed",
            message: chapterInsertError.message,
            series_title: seriesTitle || undefined,
          });
        }
      } else {
        // Bulk insert all pages at once
        const pageRows = (insertedChapters ?? []).flatMap((chapter: any) => {
          const key = chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group);
          const images = chapterImages.get(key) ?? [];
          return images.map((imageUrl, index) => ({
            chapter_id: chapter.id,
            page_number: index + 1,
            image_url: imageUrl,
          }));
        });

        const { error: pagesError } = await admin.from("chapter_pages").insert(pageRows);
        if (pagesError) {
          for (const chapter of insertedChapters ?? []) {
            failed++;
            details.push({
              chapter: Number(chapter.chapter_number),
              status: "failed",
              message: pagesError.message,
              series_title: seriesTitle || undefined,
            });
          }
        } else {
          imported = insertedChapters?.length ?? 0;
          for (const chapter of insertedChapters ?? []) {
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
        ? `Imported ${imported} new chapter${imported !== 1 ? "s" : ""}${seriesTitle ? ` for ${seriesTitle}` : ""}.`
        : `No new chapters were imported${seriesTitle ? ` for ${seriesTitle}` : ""}.`;

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

    await admin
      .from("series_import_sources")
      .update({
        last_checked_at: startedAt,
        last_success_at: imported > 0 || failed === 0 ? startedAt : source.last_success_at,
        last_error: failed > 0 && imported === 0 ? details.find((entry) => entry.status === "failed")?.message : null,
      })
      .eq("id", source.id);

    return {
      success: true,
      chaptersFound,
      imported,
      skipped,
      failed,
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
  return `${chapterNumber}::${scanlationGroup?.trim() || ""}`;
}

const PREMIUM_KEYWORDS = [
  "premium", "locked", "paid", "coin", "coins", "points",
  "vip", "paywall", "buy", "purchase", "unlock", "ticket", "tickets",
  "early-access", "early access", "subscribers-only", "subscriber only",
  "fastpass", "fast-pass", "kofi", "patreon", "subscribers",
  "🔒", "🔐", "💰", "💎", "🪙", "🏷️",
];

function isPremiumChapter(chapter: { chapterNumber: number; title?: string; url: string }): boolean {
  const titleLower = (chapter.title || "").toLowerCase();
  const urlLower = chapter.url.toLowerCase();

  // 1. Keyword checks in title and URL
  if (PREMIUM_KEYWORDS.some((kw) => titleLower.includes(kw) || urlLower.includes(kw))) {
    return true;
  }

  // 2. Price / currency / lock patterns in chapter title
  if (/\b(?:cost|price|buy|\d+\s*(?:coins?|points?|gems?|diamonds?|tickets?))\b/i.test(titleLower)) {
    return true;
  }
  if (/\b(?:locked|unlock\s*with|subscriber\s*only|paid\s*chapter|early\s*access)\b/i.test(titleLower)) {
    return true;
  }

  return false;
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
    return hostname.includes("qimanhwa.com") || hostname.includes("qiscans.org");
  } catch {
    return url.toLowerCase().includes("qimanhwa.com") || url.toLowerCase().includes("qiscans");
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
    lowercaseUrl.includes("/upload/upload/series/")
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

