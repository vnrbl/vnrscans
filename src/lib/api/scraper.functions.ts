import { createServerFn } from "@tanstack/react-start";
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

export const $extractChaptersFromUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    try {
      const chapters = await extractChaptersFromSeriesUrl(data.url);
      return { success: true, chapters };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to extract chapters" 
      };
    }
  });

export const $extractImagesFromUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    try {
      const images = await extractImagesFromChapterUrl(data.url);
      return { success: true, images };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to extract images" 
      };
    }
  });

export const $syncImportSource = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sourceId: z.string().uuid(),
      accessToken: z.string().min(1),
      maxChapters: z.number().int().min(1).max(25).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await verifyAdmin(data.accessToken);

    const admin = getAdminSupabase();
    const maxChapters = data.maxChapters ?? 10;
    const startedAt = new Date().toISOString();

    const { data: source, error: sourceError } = await admin
      .from("series_import_sources")
      .select("*")
      .eq("id", data.sourceId)
      .single();

    if (sourceError || !source) {
      return { success: false, error: sourceError?.message || "Import source not found" };
    }

    const sourcePreset = detectImportSource(source.source_url);
    const scanlationGroup = source.scanlation_group || sourcePreset.scanlationGroup || null;
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
        { concurrency: 2 },
      );

      for (const chapter of missing) {
        try {
          const rawImages =
            batchExtractedImages.get(chapter.url) ?? (await extractImagesFromChapterUrl(chapter.url));
          const images = filterImagesByExampleUrl(rawImages, source.image_url_example || "");
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
  });

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${scanlationGroup?.trim() || ""}`;
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
