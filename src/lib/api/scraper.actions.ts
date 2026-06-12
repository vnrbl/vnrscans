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
  };
}) {
  const { data } = args;
  const validated = z.object({ url: z.string().url() }).parse(data);
  try {
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
  };
}) {
  const { data } = args;
  const validated = z
    .object({
      url: z.string().url(),
      imageUrlExample: z.string().url().optional().or(z.literal("")),
    })
    .parse(data);
  try {
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

  const discovered = await extractChaptersFromSeriesUrl(validated.url);

  if (!validated.seriesId) {
    return {
      success: true,
      dryRun: true,
      chaptersFound: discovered.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      details: discovered.map((chapter) => ({
        chapter: chapter.chapterNumber,
        status: "found",
        url: chapter.url,
      })),
    };
  }

  const { data: existingRows, error: existingError } = await admin
    .from("chapters")
    .select("chapter_number,scanlation_group")
    .eq("series_id", validated.seriesId);

  if (existingError) throw existingError;

  const existingKeys = new Set(
    (existingRows ?? []).map((chapter: any) =>
      chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
    ),
  );

  let exactDuplicateCount = 0;
  const missing = discovered.filter((chapter) => {
    const isExactDuplicate = existingKeys.has(chapterScanKey(chapter.chapterNumber, scanlationGroup));
    if (isExactDuplicate) exactDuplicateCount++;
    return !isExactDuplicate;
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

  const extractedImages = await extractImagesFromChapterUrls(
    missing.map((chapter) => chapter.url),
    { concurrency: 4, imageUrlExample },
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
}

export async function $syncImportSource(args: {
  data: {
    sourceId: string;
    accessToken: string;
    maxChapters?: number;
  };
}) {
  const { data } = args;
  const validated = z
    .object({
      sourceId: z.string().uuid(),
      accessToken: z.string().min(1),
      maxChapters: z.number().int().min(1).max(25).optional(),
    })
    .parse(data);

  await verifyAdmin(validated.accessToken);

  const admin = getAdminSupabase();
  const maxChapters = validated.maxChapters ?? 10;
  const startedAt = new Date().toISOString();

  const { data: source, error: sourceError } = await admin
    .from("series_import_sources")
    .select("*")
    .eq("id", validated.sourceId)
    .single();

  if (sourceError || !source) {
    return { success: false, error: sourceError?.message || "Import source not found" };
  }

  const sourcePreset = detectImportSource(source.source_url);
  const scanlationGroup = source.scanlation_group || sourcePreset.scanlationGroup || null;
  const imageUrlExample = source.image_url_example || sourcePreset.imageUrlExample || null;
  let chaptersFound = 0;
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const details: Array<{ chapter: number; status: string; message?: string }> = [];

  try {
    const discovered = await extractChaptersFromSeriesUrl(source.source_url);
    chaptersFound = discovered.length;

    const { data: existingRows, error: existingError } = await admin
      .from("chapters")
      .select("chapter_number,scanlation_group")
      .eq("series_id", source.series_id);

    if (existingError) throw existingError;

    const existingKeys = new Set(
      (existingRows ?? []).map((chapter: any) =>
        chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
      ),
    );

    const missing = discovered
      .filter((chapter) => !existingKeys.has(chapterScanKey(chapter.chapterNumber, scanlationGroup)))
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .slice(0, maxChapters);

    skipped = discovered.length - missing.length;
    const batchExtractedImages = await extractImagesFromChapterUrls(
      missing.map((chapter) => chapter.url),
      { concurrency: 4, imageUrlExample },
    );

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

        const { data: chapterRecord, error: chapterError } = await admin
          .from("chapters")
          .insert({
            series_id: source.series_id,
            chapter_number: chapter.chapterNumber,
            title: chapter.title || null,
            slug: targetSlug,
            chapter_type: "image",
            status: source.auto_publish ? "published" : "draft",
            uploaded_by: source.source_site || sourcePreset.sourceSite,
            scanlation_group: scanlationGroup,
          })
          .select("id")
          .single();

        if (chapterError) throw chapterError;

        const pages = images.map((imageUrl, index) => ({
          chapter_id: chapterRecord.id,
          page_number: index + 1,
          image_url: imageUrl,
        }));

        const { error: pagesError } = await admin.from("chapter_pages").insert(pages);
        if (pagesError) throw pagesError;

        imported++;
        details.push({ chapter: chapter.chapterNumber, status: "imported" });
        existingKeys.add(chapterScanKey(chapter.chapterNumber, scanlationGroup));
      } catch (chapterError) {
        failed++;
        details.push({
          chapter: chapter.chapterNumber,
          status: "failed",
          message: chapterError instanceof Error ? chapterError.message : "Unknown error",
        });
      }
    }

    const status = failed > 0 && imported > 0 ? "partial" : failed > 0 ? "failed" : "success";
    const message =
      imported > 0
        ? `Imported ${imported} new chapter${imported !== 1 ? "s" : ""}.`
        : "No new chapters were imported.";

    await admin.from("series_import_logs").insert({
      source_id: source.id,
      status,
      message,
      chapters_found: chaptersFound,
      chapters_imported: imported,
      chapters_skipped: skipped,
      chapters_failed: failed,
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
    const message = error instanceof Error ? error.message : "Sync failed";
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
}

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${scanlationGroup?.trim() || ""}`;
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
